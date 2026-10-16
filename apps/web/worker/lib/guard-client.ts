import type { Env } from '../env';
import type { ReserveResult } from './budget';
import { BUDGET_SCOPE, type GuardApi, type GuardOp } from './guard-ops';
import type { LimitResult } from './limits';

/** Talks to the Guard Durable Objects. Each name is its own small object: budget, and one per kind. */
export function remoteGuard(env: Env): GuardApi {
  async function call<T>(scope: string, msg: GuardOp): Promise<T> {
    const stub = env.GUARD.get(env.GUARD.idFromName(scope));
    // the address is never used for routing; the object only reads the body
    const res = await stub.fetch('https://guard.internal/', {
      method: 'POST',
      body: JSON.stringify(msg),
    });
    if (!res.ok) throw new Error(`guard answered ${res.status}`);
    return (await res.json()) as T;
  }
  return {
    check: (scope, checks) => call<LimitResult>(scope, { op: 'check', checks }),
    reserve: (maxCost) => call<ReserveResult>(BUDGET_SCOPE, { op: 'reserve', maxCost }),
    settle: (id, actual) => call<void>(BUDGET_SCOPE, { op: 'settle', id, actual }),
    release: (id) => call<void>(BUDGET_SCOPE, { op: 'release', id }),
    setKilled: (killed) => call<void>(BUDGET_SCOPE, { op: 'kill', killed }),
  };
}
