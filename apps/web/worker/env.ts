import type { D1Database, DurableObjectNamespace, Fetcher } from '@cloudflare/workers-types';

/** Everything the Worker is given by Cloudflare: bindings, plain variables and secrets. */
export interface Env {
  /** The built site, served for every address that is not under /api. */
  ASSETS: Fetcher;
  /** Chats, messages, feedback and events. */
  DB: D1Database;
  /** The address the site is served from; the only origin allowed to change anything. */
  SITE_ORIGIN?: string;
  /** Rate-limit counters and the spend total (class Guard). */
  GUARD: DurableObjectNamespace;
  /** Secret for the keyed hashes that stand in for IP addresses. */
  HMAC_SECRET: string;
  /** Secret for Cloudflare Turnstile. Without it the check is skipped unless REQUIRE_TURNSTILE is "true". */
  TURNSTILE_SECRET?: string;
  REQUIRE_TURNSTILE?: string;
  /** Spending caps in millionths of a US dollar (defaults: 5,000,000 a month, 500,000 a day). */
  BUDGET_MONTH_MICRO_USD?: string;
  BUDGET_DAY_MICRO_USD?: string;
  /** Set to "true" to stop all paid answers at once. */
  KILL_SWITCH?: string;
}
