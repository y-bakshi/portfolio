import type { KvStorage } from './storage';
import { nextDayMs, nextMonthMs, utcDay, utcMonth } from './period';

/** Starting caps, in millionths of a US dollar: 5 dollars a month and 0.50 a day. */
export const DEFAULT_MONTH_CAP = 5_000_000;
export const DEFAULT_DAY_CAP = 500_000;
/** A reservation not settled or released by now is kept as spent: we cannot know what it cost. */
export const RESERVATION_TIMEOUT_MS = 5 * 60_000;
/** How long a kill switch refusal tells the visitor to wait before trying again. */
const KILLED_RETRY_MS = 60 * 60_000;

export type Caps = { month: number; day: number };
export type ReserveResult =
  { ok: true; id: string } | { ok: false; reason: 'killed' | 'day' | 'month'; retryAtMs: number };

type Reservation = { amount: number; at: number; month: string; day: string };

const spentKey = (kind: 'm' | 'd', period: string) => `spent:${kind}:${period}`;

/** Reads the caps from the environment text, falling back to the defaults for anything unusable. */
export function capsFrom(env: {
  BUDGET_MONTH_MICRO_USD?: string;
  BUDGET_DAY_MICRO_USD?: string;
}): Caps {
  const read = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return v !== undefined && v.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : fallback;
  };
  return {
    month: read(env.BUDGET_MONTH_MICRO_USD, DEFAULT_MONTH_CAP),
    day: read(env.BUDGET_DAY_MICRO_USD, DEFAULT_DAY_CAP),
  };
}

async function addSpent(storage: KvStorage, r: Reservation, amount: number) {
  for (const [kind, period] of [
    ['m', r.month],
    ['d', r.day],
  ] as const) {
    const key = spentKey(kind, period);
    await storage.put(key, ((await storage.get<number>(key)) ?? 0) + amount);
  }
}

/** Turns reservations past the timeout into spending, at the amount that was reserved. */
async function sweep(storage: KvStorage, nowMs: number) {
  for (const [key, r] of await storage.list<Reservation>({ prefix: 'res:' })) {
    if (nowMs - r.at < RESERVATION_TIMEOUT_MS) continue;
    await addSpent(storage, r, r.amount);
    await storage.delete(key);
  }
}

/** Sets the kill switch: while on, every reservation is refused. */
export async function setKilled(storage: KvStorage, killed: boolean) {
  await storage.put('killed', killed);
}

/** Holds back `maxCost` against the day and month caps, or says why not and when to retry. */
export async function reserve(
  storage: KvStorage,
  nowMs: number,
  caps: Caps,
  maxCost: number,
): Promise<ReserveResult> {
  const month = utcMonth(nowMs);
  const day = utcDay(nowMs);
  if (await storage.get<boolean>('killed')) {
    return { ok: false, reason: 'killed', retryAtMs: nowMs + KILLED_RETRY_MS };
  }
  await sweep(storage, nowMs);
  const held = [...(await storage.list<Reservation>({ prefix: 'res:' })).values()];
  const total = async (kind: 'm' | 'd', period: string, mine: (r: Reservation) => boolean) =>
    ((await storage.get<number>(spentKey(kind, period))) ?? 0) +
    held.filter(mine).reduce((sum, r) => sum + r.amount, 0);

  if ((await total('m', month, (r) => r.month === month)) + maxCost > caps.month) {
    return { ok: false, reason: 'month', retryAtMs: nextMonthMs(nowMs) };
  }
  if ((await total('d', day, (r) => r.day === day)) + maxCost > caps.day) {
    return { ok: false, reason: 'day', retryAtMs: nextDayMs(nowMs) };
  }
  const id = crypto.randomUUID();
  await storage.put(`res:${id}`, { amount: maxCost, at: nowMs, month, day } satisfies Reservation);
  return { ok: true, id };
}

/** Records what the request really cost and frees the rest. A settle after the timeout is ignored. */
export async function settle(storage: KvStorage, nowMs: number, id: string, actual: number) {
  await sweep(storage, nowMs);
  const r = await storage.get<Reservation>(`res:${id}`);
  if (!r) return;
  await addSpent(storage, r, Math.max(0, Math.round(actual)));
  await storage.delete(`res:${id}`);
}

/** Frees a reservation when nothing was spent. A release after the timeout is ignored. */
export async function release(storage: KvStorage, nowMs: number, id: string) {
  await sweep(storage, nowMs);
  await storage.delete(`res:${id}`);
}

/** Removes old spending totals (earlier months and days). */
export async function pruneSpent(storage: KvStorage, nowMs: number) {
  const keep = new Set([spentKey('m', utcMonth(nowMs)), spentKey('d', utcDay(nowMs))]);
  for (const key of (await storage.list<number>({ prefix: 'spent:' })).keys()) {
    if (!keep.has(key)) await storage.delete(key);
  }
}
