import type { Env } from '../env';
import type { ApiError } from './http';

/** What the request is for, because each kind has its own limits. */
export type AdmissionKind = 'session' | 'chat' | 'feedback';

/** Permission to go ahead. The caller must settle or release it so the budget stays accurate. */
export type Admitted = {
  ok: true;
  /** Record what the request really cost, in integer millionths of a US dollar. */
  settle(actualMicroUsd: number): Promise<void>;
  /** Give back the reservation when nothing was spent (for example the request was refused later). */
  release(): Promise<void>;
};

/** Refused: nothing was reserved, and `error` is ready to be thrown or sent. */
export type Refused = { ok: false; error: ApiError };

/**
 * Decides whether a request may go ahead: rate limits per visitor and per network, the global
 * spend cap, and the kill switch. The protection phase supplies the real one.
 */
export interface Admission {
  admit(
    request: Request,
    env: Env,
    options: { kind: AdmissionKind; maxCostMicroUsd: number },
  ): Promise<Admitted | Refused>;
}

/** Lets everything through and tracks nothing. Used until the real limits are in place, and in tests. */
export const openAdmission: Admission = {
  async admit() {
    return { ok: true, settle: async () => {}, release: async () => {} };
  },
};
