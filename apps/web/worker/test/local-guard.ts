import type { Caps, ReserveResult } from '../lib/budget';
import type { Clock } from '../lib/clock';
import { BUDGET_SCOPE, runOp, type GuardApi, type GuardOp } from '../lib/guard-ops';
import type { LimitResult } from '../lib/limits';
import { memoryStorage, type KvStorage } from '../lib/storage';

/** A Guard that runs in this process over in-memory storage, one store per scope like the real one. */
export function localGuard(clock: Clock, caps: Caps): GuardApi {
  const stores = new Map<string, KvStorage>();
  const at = (scope: string) => stores.get(scope) ?? stores.set(scope, memoryStorage()).get(scope)!;
  const run = (scope: string, msg: GuardOp) => runOp(at(scope), clock(), caps, msg);
  return {
    check: (scope, checks) => run(scope, { op: 'check', checks }) as Promise<LimitResult>,
    reserve: (maxCost) => run(BUDGET_SCOPE, { op: 'reserve', maxCost }) as Promise<ReserveResult>,
    settle: async (id, actual) => void (await run(BUDGET_SCOPE, { op: 'settle', id, actual })),
    release: async (id) => void (await run(BUDGET_SCOPE, { op: 'release', id })),
    setKilled: async (killed) => void (await run(BUDGET_SCOPE, { op: 'kill', killed })),
  };
}
