import type { Db } from './db';
import type { AnswerMeta, Turn } from './answerer';

/** A message as the API returns it. `rating` is the visitor's thumb on an answer, if any. */
export type StoredMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cites: string[];
  createdAt: string;
  rating: -1 | 1 | null;
};

/** A message about to be stored. `latencyMs` and `meta` are only set on answers. */
export type NewMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cites?: string[];
  meta?: AnswerMeta;
  latencyMs?: number;
};

type Row = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cites_json: string;
  created_at: number;
  rating: number | null;
};

function parseCites(json: string): string[] {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

const toMessage = (row: Row): StoredMessage => ({
  id: row.id,
  role: row.role,
  text: row.text,
  cites: parseCites(row.cites_json),
  createdAt: new Date(row.created_at).toISOString(),
  rating: row.rating === 1 || row.rating === -1 ? row.rating : null,
});

/** Starts a chat. Nothing identifying is kept: just the id and two times. */
export async function createChat(db: Db, id: string, now: number): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO chats (id, created_at, last_seen_at) VALUES (?, ?, ?)')
    .bind(id, now, now)
    .run();
}

export async function chatExists(db: Db, id: string): Promise<boolean> {
  return (await db.prepare('SELECT 1 AS found FROM chats WHERE id = ?').bind(id).first()) !== null;
}

/** Records that the visitor is still here, so retention counts from the last visit. */
export async function touchChat(db: Db, id: string, now: number): Promise<void> {
  await db.prepare('UPDATE chats SET last_seen_at = ? WHERE id = ?').bind(now, id).run();
}

/**
 * Adds a message with the next sequence number. The number is worked out inside the INSERT itself,
 * so two messages added at the same moment cannot pick the same one.
 */
export async function appendMessage(
  db: Db,
  chatId: string,
  message: NewMessage,
  now: number,
): Promise<number> {
  const { meta } = message;
  const row = await db
    .prepare(
      `INSERT INTO messages
         (id, chat_id, seq, role, text, cites_json, model, retrieval_ids_json, top_score,
          input_tokens, output_tokens, cost_micro_usd, latency_ms, created_at)
       SELECT ?, ?, COALESCE(MAX(seq), 0) + 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       FROM messages WHERE chat_id = ?
       RETURNING seq`,
    )
    .bind(
      message.id,
      chatId,
      message.role,
      message.text,
      JSON.stringify(message.cites ?? []),
      meta?.model ?? null,
      meta?.retrievalIds ? JSON.stringify(meta.retrievalIds) : null,
      meta?.topScore ?? null,
      meta?.inputTokens ?? null,
      meta?.outputTokens ?? null,
      meta?.costMicroUsd ?? null,
      message.latencyMs ?? null,
      now,
      chatId,
    )
    .first<{ seq: number }>();
  return row?.seq ?? 0;
}

const SELECT_MESSAGES = `SELECT m.id, m.role, m.text, m.cites_json, m.created_at, f.value AS rating
  FROM messages m LEFT JOIN feedback f ON f.message_id = m.id`;

/** Every message of a chat, oldest first. */
export async function listMessages(db: Db, chatId: string): Promise<StoredMessage[]> {
  const { results } = await db
    .prepare(`${SELECT_MESSAGES} WHERE m.chat_id = ? ORDER BY m.seq`)
    .bind(chatId)
    .all<Row>();
  return results.map(toMessage);
}

/** The last few turns, oldest first, to give an answerer some context. */
export async function recentTurns(db: Db, chatId: string, limit: number): Promise<Turn[]> {
  const { results } = await db
    .prepare('SELECT role, text FROM messages WHERE chat_id = ? ORDER BY seq DESC LIMIT ?')
    .bind(chatId, limit)
    .all<Turn>();
  return results.reverse().map(({ role, text }) => ({ role, text }));
}

/** Deletes a chat; its messages and their feedback go with it. True when there was one. */
export async function deleteChat(db: Db, chatId: string): Promise<boolean> {
  const { meta } = await db.prepare('DELETE FROM chats WHERE id = ?').bind(chatId).run();
  return meta.changes > 0;
}

/** True when the message exists, belongs to this chat and has the given role. */
export async function ownsMessage(
  db: Db,
  chatId: string,
  messageId: string,
  role: 'user' | 'assistant',
): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 AS found FROM messages WHERE id = ? AND chat_id = ? AND role = ?')
    .bind(messageId, chatId, role)
    .first();
  return row !== null;
}

/** One thumb per answer: a second one replaces the first. */
export async function setFeedback(
  db: Db,
  messageId: string,
  value: -1 | 1,
  now: number,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO feedback (message_id, value, created_at) VALUES (?, ?, ?)
       ON CONFLICT (message_id) DO UPDATE SET value = excluded.value, created_at = excluded.created_at`,
    )
    .bind(messageId, value, now)
    .run();
}
