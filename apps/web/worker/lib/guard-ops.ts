import * as budget from './budget';
import type { Caps, ReserveResult } from './budget';
import { checkLimits, pruneLimits, type Check, type LimitResult } from './limits';
import type { KvStorage } from './storage';

/** The one object that holds all spending. Limits use one object per kind of request instead. */
export const BUDGET_SCOPE = 'budget';

/** What the Worker may ask of a Guard object. */
export type GuardOp =
  | { op: 'check'; checks: Check[] }
  | { op: 'reserve'; maxCost: number }
  | { op: 'settle'; id: string; actual: number }
  | { op: 'release'; id: string }
  | { op: 'kill'; killed: boolean };

/** The Guard as the rest of the Worker sees it, whether it runs remotely or in a test. */
export interface GuardApi {
  check(scope: string, checks: Check[]): Promise<LimitResult>;
  reserve(maxCost: number): Promise<ReserveResult>;
  settle(id: string, actual: number): Promise<void>;
  release(id: string): Promise<void>;
  setKilled(killed: boolean): Promise<void>;
}

const HOUR = 60 * 60_000;

/** Old counters and totals are cleared at most once an hour, as a side effect of normal traffic. */
async function maybePrune(storage: KvStorage, nowMs: number) {
  const last = (await storage.get<number>('meta:pruned')) ?? 0;
  if (nowMs - last < HOUR) return;
  await storage.put('meta:pruned', nowMs);
  await pruneLimits(storage, nowMs);
  await budget.pruneSpent(storage, nowMs);
}

/** Runs one request against a Guard's storage. All the logic is in limits.ts and budget.ts. */
export async function runOp(
  storage: KvStorage,
  nowMs: number,
  caps: Caps,
  msg: GuardOp,
): Promise<LimitResult | ReserveResult | void> {
  await maybePrune(storage, nowMs);
  switch (msg.op) {
    case 'check':
      return checkLimits(storage, nowMs, msg.checks);
    case 'reserve':
      return budget.reserve(storage, nowMs, caps, msg.maxCost);
    case 'settle':
      return budget.settle(storage, nowMs, msg.id, msg.actual);
    case 'release':
      return budget.release(storage, nowMs, msg.id);
    case 'kill':
      return budget.setKilled(storage, msg.killed);
  }
}
