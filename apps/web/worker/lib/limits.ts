import type { AdmissionKind } from './admission';
import type { KvStorage } from './storage';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** At most `limit` requests per `windowMs`. The name keeps each rule's counters apart. */
export type Rule = { name: string; limit: number; windowMs: number };

/** Which key a rule counts against: the chat (visitor) or the network. */
export type RuleSet = { by: 'visitor' | 'network'; rule: Rule }[];

/** All the limits, in one place. Change a number here and every part follows. */
export const RULES: Record<AdmissionKind, RuleSet> = {
  chat: [
    { by: 'visitor', rule: { name: 'chat-burst', limit: 6, windowMs: MINUTE } },
    { by: 'visitor', rule: { name: 'chat-day', limit: 60, windowMs: DAY } },
    { by: 'network', rule: { name: 'chat-net-day', limit: 150, windowMs: DAY } },
  ],
  session: [{ by: 'network', rule: { name: 'session-burst', limit: 10, windowMs: MINUTE } }],
  feedback: [{ by: 'network', rule: { name: 'feedback-day', limit: 30, windowMs: DAY } }],
};

export type Check = { key: string; rule: Rule };
export type LimitResult = { allowed: true } | { allowed: false; retryAtMs: number };

type Counter = { start: number; count: number };

/**
 * Fixed windows: each rule and key has one counter that restarts when its window ends. All the
 * checks pass or none is counted, so a refused request uses up nothing.
 */
export async function checkLimits(
  storage: KvStorage,
  nowMs: number,
  checks: Check[],
): Promise<LimitResult> {
  const live: { id: string; counter: Counter }[] = [];
  let retryAtMs = 0;
  for (const { key, rule } of checks) {
    const id = `lim:${rule.name}:${key}`;
    const start = Math.floor(nowMs / rule.windowMs) * rule.windowMs;
    const stored = await storage.get<Counter>(id);
    const counter = stored && stored.start === start ? stored : { start, count: 0 };
    if (counter.count >= rule.limit) retryAtMs = Math.max(retryAtMs, start + rule.windowMs);
    live.push({ id, counter });
  }
  if (retryAtMs > 0) return { allowed: false, retryAtMs };
  for (const { id, counter } of live) {
    await storage.put(id, { ...counter, count: counter.count + 1 });
  }
  return { allowed: true };
}

/** Removes counters whose window is over, so the store does not grow without end. */
export async function pruneLimits(storage: KvStorage, nowMs: number, maxWindowMs = DAY) {
  for (const [id, counter] of await storage.list<Counter>({ prefix: 'lim:' })) {
    if (counter.start + maxWindowMs <= nowMs) await storage.delete(id);
  }
}
