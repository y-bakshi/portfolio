import type { Ai, D1Database, Fetcher, Vectorize } from '@cloudflare/workers-types';

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
}
