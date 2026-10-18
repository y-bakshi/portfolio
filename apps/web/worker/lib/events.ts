import type { Clock } from './clock';
import type { Db } from './db';

/** The only things the guide records. A closed list, so a typo cannot create a new kind of event. */
export const EVENT_TYPES = [
  'chat_started',
  'question_asked',
  'answer_shown',
  'cite_clicked',
  'feedback',
  'rate_limited',
  'fallback_used',
  'error',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** A number, a short code made of safe characters, or a thumb (1 or -1). Never free text. */
type Kind = 'number' | 'code' | 'thumb';

/** The keys each event may carry. Anything else is dropped before it reaches the database. */
const KEYS: Record<EventType, Record<string, Kind>> = {
  chat_started: {},
  question_asked: { length: 'number' },
  answer_shown: {
    latencyMs: 'number',
    inputTokens: 'number',
    outputTokens: 'number',
    costMicroUsd: 'number',
    topScore: 'number',
    model: 'code',
  },
  cite_clicked: { sourceId: 'code' },
  feedback: { value: 'thumb' },
  rate_limited: { scope: 'code' },
  fallback_used: { reason: 'code' },
  error: { code: 'code' },
};

/** Ids, model names and error codes look like `gemini-2.5-flash` or `rag/low_score`, not sentences. */
const CODE = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,63}$/;

/** The most the data of one event may take once written as JSON. */
export const MAX_DATA_BYTES = 1024;

export type EventInput = {
  type: EventType;
  chatId?: string | null;
  data?: Record<string, unknown>;
};

function accept(kind: Kind, value: unknown): boolean {
  if (kind === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (kind === 'thumb') return value === 1 || value === -1;
  return typeof value === 'string' && CODE.test(value);
}

/** Keeps only the known keys with well-formed values. Visitor text can never get through. */
export function cleanData(type: EventType, data: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(KEYS[type])) {
    if (Object.hasOwn(data, key) && accept(kind, data[key])) out[key] = data[key];
  }
  return out;
}

/**
 * Writes one event. It never throws: analytics must not break a request. Returns false when the
 * event was refused (unknown type, too large) or the database failed.
 */
export async function recordEvent(db: Db, clock: Clock, input: EventInput): Promise<boolean> {
  try {
    if (!(EVENT_TYPES as readonly string[]).includes(input.type)) return false;
    const data = cleanData(input.type, input.data);
    const json = Object.keys(data).length ? JSON.stringify(data) : null;
    if (json && new TextEncoder().encode(json).length > MAX_DATA_BYTES) return false;
    await db
      .prepare('INSERT INTO events (chat_id, type, data_json, created_at) VALUES (?, ?, ?, ?)')
      .bind(input.chatId ?? null, input.type, json, clock())
      .run();
    return true;
  } catch (error) {
    // a short message only: the cause is enough to find, and no visitor data is in it
    console.warn('event not recorded', input.type, error instanceof Error ? error.message : '');
    return false;
  }
}
