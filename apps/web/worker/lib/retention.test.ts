// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { testDb } from '../test/sqlite-d1';
import { runRetention } from './retention';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 14);
const ago = (days: number) => NOW - days * DAY;

function seed() {
  const db = testDb();
  const chat = (id: string, created: number, seen: number) =>
    db.exec(
      `INSERT INTO chats (id, created_at, last_seen_at) VALUES ('${id}', ${created}, ${seen})`,
    );
  const msg = (id: string, chat: string, seq: number, at: number) =>
    db.exec(
      `INSERT INTO messages (id, chat_id, seq, role, text, created_at) VALUES ('${id}', '${chat}', ${seq}, 'user', 'q', ${at})`,
    );
  // an old chat with old messages and feedback
  chat('old', ago(120), ago(100));
  msg('m-old', 'old', 1, ago(100));
  db.exec(`INSERT INTO feedback (message_id, value, created_at) VALUES ('m-old', 1, ${ago(100)})`);
  // a live chat with one old and one recent message
  chat('live', ago(120), ago(2));
  msg('m-live-old', 'live', 1, ago(95));
  msg('m-live-new', 'live', 2, ago(2));
  db.exec(
    `INSERT INTO feedback (message_id, value, created_at) VALUES ('m-live-new', -1, ${ago(2)})`,
  );
  // an empty chat that is old, and an empty chat that is new
  chat('empty-old', ago(91), ago(91));
  chat('empty-new', ago(1), ago(1));
  db.exec(`INSERT INTO events (type, created_at) VALUES ('a', ${ago(91)}), ('b', ${ago(5)})`);
  return db;
}

const count = (db: ReturnType<typeof testDb>, table: string) =>
  (db.raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe('retention', () => {
  it('deletes only what is older than 90 days and reports counts', async () => {
    const db = seed();
    const counts = await runRetention(db, () => NOW);
    expect(counts).toEqual({ messages: 2, chats: 2, events: 1 });
    expect(count(db, 'messages')).toBe(1);
    expect(count(db, 'feedback')).toBe(1);
    expect(count(db, 'events')).toBe(1);
    const ids = db.raw.prepare('SELECT id FROM chats ORDER BY id').all();
    expect(ids).toEqual([{ id: 'empty-new' }, { id: 'live' }]);
  });

  it('does nothing when everything is recent, and again on a second run', async () => {
    const db = seed();
    await runRetention(db, () => NOW);
    expect(await runRetention(db, () => NOW)).toEqual({ messages: 0, chats: 0, events: 0 });
  });

  it('removes a chat that has gone quiet along with its messages', async () => {
    const db = seed();
    await runRetention(db, () => NOW + 100 * DAY);
    expect(count(db, 'chats')).toBe(0);
    expect(count(db, 'messages')).toBe(0);
    expect(count(db, 'feedback')).toBe(0);
  });
});
