import type { Env } from '../env';
import type { Admission, AdmissionKind } from './admission';
import { systemClock, type Clock } from './clock';
import type { GuardApi } from './guard-ops';
import { remoteGuard } from './guard-client';
import { ApiError } from './http';
import { networkKey, visitorKey } from './identity';
import { RULES } from './limits';

export type ProtectOptions = {
  clock?: Clock;
  /** How to reach the Guard; the real Durable Objects unless a test supplies its own. */
  guard?: (env: Env) => GuardApi;
  /** The chat id of the caller, if known. The default reads it from the `chat` cookie. */
  visitorId?: (request: Request) => string | null;
};

/** The chat id is the part of the cookie before any signature dot. */
function chatIdFromCookie(request: Request): string | null {
  const match = /(?:^|;\s*)chat=([^;]+)/.exec(request.headers.get('cookie') ?? '');
  return match ? decodeURIComponent(match[1]).split('.')[0] : null;
}

/** "about a minute", "about 12 minutes", "about 3 hours": enough to know when to come back. */
function waitPhrase(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes <= 1) return 'about a minute';
  if (minutes < 90) return `about ${minutes} minutes`;
  return `about ${Math.ceil(minutes / 60)} hours`;
}

/** Seconds to wait, for a Retry-After header. Zero when the error carries no time. */
export function retryAfterSeconds(error: ApiError, nowMs: number = Date.now()): number {
  if (!error.retryAt) return 0;
  return Math.max(1, Math.ceil((Date.parse(error.retryAt) - nowMs) / 1000));
}

const RESTING = 'The built-in answers still work.';

function tooMany(retryAtMs: number, nowMs: number) {
  const message = `That is a lot of questions in a short time. Please try again in ${waitPhrase(retryAtMs - nowMs)}. ${RESTING}`;
  return new ApiError(429, 'rate_limited', message, new Date(retryAtMs).toISOString());
}

function resting(why: 'killed' | 'day' | 'month', retryAtMs: number) {
  const when = {
    killed: 'right now',
    day: 'for today, to keep its running costs small',
    month: 'until next month, to keep its running costs small',
  }[why];
  const message = `The guide is resting ${when}. ${RESTING}`;
  return new ApiError(503, 'unavailable', message, new Date(retryAtMs).toISOString());
}

/** Kinds that call a paid model and so need budget. */
const COSTS_MONEY: AdmissionKind[] = ['chat'];

/** The real admission: limits per visitor and per network, then the spend cap and kill switch. */
export function createAdmission(options: ProtectOptions = {}): Admission {
  const clock = options.clock ?? systemClock;
  const connect = options.guard ?? remoteGuard;
  const visitorId = options.visitorId ?? chatIdFromCookie;

  return {
    async admit(request, env, { kind, maxCostMicroUsd }) {
      const now = clock();
      const spends = COSTS_MONEY.includes(kind) && maxCostMicroUsd > 0;
      // the owner's emergency switch needs no storage, so it works even if the Guard is down
      if (spends && env.KILL_SWITCH === 'true') {
        return { ok: false, error: resting('killed', now + 60 * 60_000) };
      }
      try {
        const guard = connect(env);
        const network = await networkKey(request, env, clock);
        const chatId = visitorId(request);
        const visitor = chatId ? await visitorKey(chatId, env, clock) : network;
        const checks = RULES[kind].map(({ by, rule }) => ({
          rule,
          key: by === 'visitor' ? visitor : network,
        }));
        const limit = await guard.check(`limits:${kind}`, checks);
        if (!limit.allowed) return { ok: false, error: tooMany(limit.retryAtMs, now) };
        if (!spends) return { ok: true, settle: async () => {}, release: async () => {} };

        const held = await guard.reserve(maxCostMicroUsd);
        if (!held.ok) return { ok: false, error: resting(held.reason, held.retryAtMs) };
        // if settling fails the reservation stays counted as spent, which is the safe side
        const quietly = (work: Promise<void>) =>
          work.catch(() => console.error('guard update failed'));
        return {
          ok: true,
          settle: (actual) => quietly(guard.settle(held.id, actual)),
          release: () => quietly(guard.release(held.id)),
        };
      } catch (error) {
        // never let a broken guard turn into free, unlimited spending
        console.error('admission failed', error instanceof Error ? error.message : 'unknown');
        return { ok: false, error: resting('killed', now + 60_000) };
      }
    },
  };
}
