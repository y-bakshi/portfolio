import type { Clock } from './clock';
import type { Db } from './db';

/** Saved questions and answers are kept this long, as the chat notice promises. */
export const RETENTION_DAYS = 90;

export type RetentionCounts = { messages: number; chats: number; events: number };

/** Deletes what is older than the retention period and says how much went. */
export async function runRetention(db: Db, clock: Clock): Promise<RetentionCounts> {
  const cutoff = clock() - RETENTION_DAYS * 24 * 60 * 60_000;
  const changes = async (sql: string, uses = 1) =>
    (
      await db
        .prepare(sql)
        .bind(...Array<number>(uses).fill(cutoff))
        .run()
    ).meta.changes;

  // feedback goes first, explicitly, so this does not depend on cascades being switched on
  await changes(
    'DELETE FROM feedback WHERE message_id IN (SELECT id FROM messages WHERE created_at < ?)',
  );
  const messages = await changes('DELETE FROM messages WHERE created_at < ?');
  // a chat goes when nobody has used it for the period, or when it never got a message
  const chats = await changes(
    `DELETE FROM chats WHERE last_seen_at < ?
       OR (created_at < ? AND NOT EXISTS (SELECT 1 FROM messages WHERE chat_id = chats.id))`,
    2,
  );
  const events = await changes('DELETE FROM events WHERE created_at < ?');
  return { messages, chats, events };
}
