import type { DurableObjectState } from '@cloudflare/workers-types';
import type { Env } from '../env';
import { capsFrom } from '../lib/budget';
import { systemClock } from '../lib/clock';
import { runOp, type GuardOp } from '../lib/guard-ops';

/**
 * Keeps counters and the spend total. Cloudflare runs one instance per name, one request at a time
 * between storage calls, which is what makes counting safe. All the logic is in lib/guard-ops.ts.
 */
export class Guard {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {}

  async fetch(request: Request & { json(): Promise<unknown> }): Promise<Response> {
    const msg = (await request.json()) as GuardOp;
    const result = await runOp(this.state.storage, systemClock(), capsFrom(this.env), msg);
    return Response.json(result ?? null);
  }
}
