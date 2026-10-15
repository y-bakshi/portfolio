import type { D1Database, Fetcher } from '@cloudflare/workers-types';

/** Everything the Worker is given by Cloudflare: bindings, plain variables and secrets. */
export interface Env {
  /** The built site, served for every address that is not under /api. */
  ASSETS: Fetcher;
  /** Chats, messages, feedback and events. */
  DB: D1Database;
  /** The address the site is served from; the only origin allowed to change anything. */
  SITE_ORIGIN?: string;
}
