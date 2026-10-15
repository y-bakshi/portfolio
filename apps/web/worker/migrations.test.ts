// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { testDb } from './test/sqlite-d1';

const NOW = 1_700_000_000_000;

describe('the database schema', () => {
  it('creates every table', async () => {
    const db = testDb();
    const { results } = await db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(['chats', 'events', 'feedback', 'messages']);
  });

  it('keeps messages in order within a chat and refuses a repeated position', async () => {
    const db = testDb();
    await db
      .prepare('INSERT INTO chats (id, created_at, last_seen_at) VALUES (?, ?, ?)')
      .bind('c1', NOW, NOW)
      .run();
    const add = (id: string, seq: number) =>
      db
        .prepare(
          'INSERT INTO messages (id, chat_id, seq, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(id, 'c1', seq, 'user', 'hi', NOW)
        .run();
    await add('m1', 0);
    await expect(add('m2', 0)).rejects.toThrow();
    await add('m3', 1);
  });

  it('refuses a role that is neither the visitor nor the guide', async () => {
    const db = testDb();
    await db
      .prepare('INSERT INTO chats (id, created_at, last_seen_at) VALUES (?, ?, ?)')
      .bind('c1', NOW, NOW)
      .run();
    await expect(
      db
        .prepare(
          'INSERT INTO messages (id, chat_id, seq, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind('m1', 'c1', 0, 'system', 'x', NOW)
        .run(),
    ).rejects.toThrow();
  });

  it('refuses a message for a chat that does not exist', async () => {
    const db = testDb();
    await expect(
      db
        .prepare(
          'INSERT INTO messages (id, chat_id, seq, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind('m1', 'missing', 0, 'user', 'x', NOW)
        .run(),
    ).rejects.toThrow();
  });

  it('deletes a chat together with its messages and their feedback', async () => {
    const db = testDb();
    await db
      .prepare('INSERT INTO chats (id, created_at, last_seen_at) VALUES (?, ?, ?)')
      .bind('c1', NOW, NOW)
      .run();
    await db
      .prepare(
        'INSERT INTO messages (id, chat_id, seq, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind('m1', 'c1', 0, 'assistant', 'answer', NOW)
      .run();
    await db
      .prepare('INSERT INTO feedback (message_id, value, created_at) VALUES (?, ?, ?)')
      .bind('m1', 1, NOW)
      .run();
    await db.prepare('DELETE FROM chats WHERE id = ?').bind('c1').run();
    expect(await db.prepare('SELECT COUNT(*) AS n FROM messages').first<{ n: number }>()).toEqual({
      n: 0,
    });
    expect(await db.prepare('SELECT COUNT(*) AS n FROM feedback').first<{ n: number }>()).toEqual({
      n: 0,
    });
  });

  it('accepts only a thumbs up or a thumbs down as feedback', async () => {
    const db = testDb();
    await db
      .prepare('INSERT INTO chats (id, created_at, last_seen_at) VALUES (?, ?, ?)')
      .bind('c1', NOW, NOW)
      .run();
    await db
      .prepare(
        'INSERT INTO messages (id, chat_id, seq, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind('m1', 'c1', 0, 'assistant', 'a', NOW)
      .run();
    await expect(
      db
        .prepare('INSERT INTO feedback (message_id, value, created_at) VALUES (?, ?, ?)')
        .bind('m1', 5, NOW)
        .run(),
    ).rejects.toThrow();
  });

  it('stores no field that could identify a visitor', async () => {
    const db = testDb();
    const columns: string[] = [];
    for (const table of ['chats', 'messages', 'feedback', 'events']) {
      const { results } = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
      columns.push(...results.map((r) => r.name));
    }
    for (const name of columns) expect(name).not.toMatch(/ip|email|phone|user_id|account|name$/i);
  });
});
