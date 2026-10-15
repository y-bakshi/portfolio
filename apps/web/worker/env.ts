import type {
  Ai,
  D1Database,
  DurableObjectNamespace,
  Fetcher,
  Vectorize,
} from '@cloudflare/workers-types';

/** Everything the Worker is given by Cloudflare: bindings, plain variables and secrets. */
export interface Env {
  /** The built site, served for every address that is not under /api. */
  ASSETS: Fetcher;
  /** Chats, messages, feedback and events. */
  DB: D1Database;
  /** The address the site is served from; the only origin allowed to change anything. */
  SITE_ORIGIN?: string;
  /** Workers AI: embeddings, and the fallback chat model. */
  AI?: Ai;
  /** Vector index of the guide's notes. Without it the notes are searched in D1. */
  VECTORIZE?: Vectorize;
  /** Secret. Key for the Gemini API. */
  GEMINI_API_KEY?: string;
  /** Gemini model name. Defaults to the one in worker/llm/constants.ts. */
  GEMINI_MODEL?: string;
  /** 'gemini', 'workers-ai' or 'mock'. Unset means the keyword guide answers. */
  LLM_PROVIDER?: string;
  /** Lowest retrieval score (0 to 1) that is still answered from the notes. */
  RAG_MIN_SCORE?: string;
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
  /** Cloudflare Access team, for example `myteam.cloudflareaccess.com`. Unset: /admin refuses all. */
  ACCESS_TEAM_DOMAIN?: string;
  /** The audience tag of the Access application that protects /admin. Unset: /admin refuses all. */
  ACCESS_AUD?: string;
  /** Exactly 'true' lets /admin skip Access, on localhost only. For local development. */
  ADMIN_DEV_BYPASS?: string;
}
