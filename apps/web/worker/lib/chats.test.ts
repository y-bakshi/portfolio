// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  appendMessage,
  chatExists,
  createChat,
  deleteChat,
  listMessages,
  ownsMessage,
  recentTurns,
  setFeedback,
  touchChat,
} from './chats';
import { testDb } from '../test/sqlite-d1';

const CHAT = 'c'.repeat(32);

async function setup() {
  const db = testDb();
  await createChat(db, CHAT, 1000);
  return db;
}

const count = (db: ReturnType<typeof testDb>, table: string) =>
  (db.raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

describe('chats', () => {
  it('creates a chat once and records only an id and two times', async () => {
    const db = await setup();
    await createChat(db, CHAT, 5000);
    expect(await chatExists(db, CHAT)).toBe(true);
    expect(await chatExists(db, 'other')).toBe(false);
    const row = db.raw.prepare('SELECT * FROM chats').get() as Record<string, unknown>;
    expect(row).toEqual({
      id: CHAT,
      created_at: 1000,
      last_seen_at: 1000,
      ua_class: null,
      locale: null,
    });
  });

  it('touches last_seen_at', async () => {
    const db = await setup();
    await touchChat(db, CHAT, 9000);
    const row = db.raw.prepare('SELECT last_seen_at AS t FROM chats').get() as { t: number };
    expect(row.t).toBe(9000);
  });
});

describe('messages', () => {
  it('numbers messages 1, 2, 3 and lists them oldest first', async () => {
    const db = await setup();
    expect(await appendMessage(db, CHAT, { id: 'm1', role: 'user', text: 'hi' }, 1)).toBe(1);
    expect(
      await appendMessage(
        db,
        CHAT,
        { id: 'm2', role: 'assistant', text: 'hello', cites: ['x'] },
        2,
      ),
    ).toBe(2);
    expect(await appendMessage(db, CHAT, { id: 'm3', role: 'user', text: 'more' }, 3)).toBe(3);
    const list = await listMessages(db, CHAT);
    expect(list.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(list[1]).toEqual({
      id: 'm2',
      role: 'assistant',
      text: 'hello',
      cites: ['x'],
      createdAt: new Date(2).toISOString(),
      rating: null,
    });
  });

  it('keeps numbering separate for each chat', async () => {
    const db = await setup();
    await createChat(db, 'd'.repeat(32), 1);
    await appendMessage(db, CHAT, { id: 'a', role: 'user', text: '1' }, 1);
    const seq = await appendMessage(db, 'd'.repeat(32), { id: 'b', role: 'user', text: '2' }, 1);
    expect(seq).toBe(1);
  });

  it('gives every message in a burst of concurrent appends its own number', async () => {
    const db = await setup();
    const seqs = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        appendMessage(db, CHAT, { id: `m${i}`, role: 'user', text: `q${i}` }, i),
      ),
    );
    expect(new Set(seqs).size).toBe(25);
    expect([...seqs].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('stores answer details when given and nothing identifying', async () => {
    const db = await setup();
    await appendMessage(
      db,
      CHAT,
      {
        id: 'm1',
        role: 'assistant',
        text: 'a',
        meta: {
          model: 'm',
          retrievalIds: ['r1', 'r2'],
          topScore: 0.8,
          inputTokens: 10,
          outputTokens: 5,
          costMicroUsd: 42,
        },
        latencyMs: 120,
      },
      1,
    );
    const row = db.raw.prepare('SELECT * FROM messages').get() as Record<string, unknown>;
    expect(row).toMatchObject({
      model: 'm',
      retrieval_ids_json: '["r1","r2"]',
      top_score: 0.8,
      input_tokens: 10,
      output_tokens: 5,
      cost_micro_usd: 42,
      latency_ms: 120,
    });
  });

  it('returns the last few turns, oldest first', async () => {
    const db = await setup();
    for (let i = 1; i <= 8; i++) {
      await appendMessage(
        db,
        CHAT,
        { id: `m${i}`, role: i % 2 ? 'user' : 'assistant', text: `t${i}` },
        i,
      );
    }
    const turns = await recentTurns(db, CHAT, 6);
    expect(turns.map((t) => t.text)).toEqual(['t3', 't4', 't5', 't6', 't7', 't8']);
    expect(turns[0]).toEqual({ role: 'user', text: 't3' });
  });

  it('treats unreadable cites as none', async () => {
    const db = await setup();
    await appendMessage(db, CHAT, { id: 'm1', role: 'assistant', text: 'a' }, 1);
    db.raw.exec("UPDATE messages SET cites_json = 'not json'");
    expect((await listMessages(db, CHAT))[0].cites).toEqual([]);
  });
});

describe('deleting and feedback', () => {
  it('deleting a chat removes its messages and feedback, and only its own', async () => {
    const db = await setup();
    await createChat(db, 'd'.repeat(32), 1);
    await appendMessage(db, CHAT, { id: 'a1', role: 'assistant', text: 'x' }, 1);
    await appendMessage(db, 'd'.repeat(32), { id: 'b1', role: 'assistant', text: 'y' }, 1);
    await setFeedback(db, 'a1', 1, 2);
    await setFeedback(db, 'b1', -1, 2);
    expect(await deleteChat(db, CHAT)).toBe(true);
    expect(count(db, 'messages')).toBe(1);
    expect(count(db, 'feedback')).toBe(1);
    expect(await deleteChat(db, CHAT)).toBe(false);
  });

  it('keeps one thumb per answer: a second one replaces the first', async () => {
    const db = await setup();
    await appendMessage(db, CHAT, { id: 'a1', role: 'assistant', text: 'x' }, 1);
    await setFeedback(db, 'a1', 1, 2);
    await setFeedback(db, 'a1', -1, 3);
    expect(count(db, 'feedback')).toBe(1);
    expect((await listMessages(db, CHAT))[0].rating).toBe(-1);
  });

  it('checks that a message belongs to a chat and has the role', async () => {
    const db = await setup();
    await createChat(db, 'd'.repeat(32), 1);
    await appendMessage(db, CHAT, { id: 'a1', role: 'assistant', text: 'x' }, 1);
    await appendMessage(db, CHAT, { id: 'u1', role: 'user', text: 'x' }, 2);
    expect(await ownsMessage(db, CHAT, 'a1', 'assistant')).toBe(true);
    expect(await ownsMessage(db, CHAT, 'u1', 'assistant')).toBe(false);
    expect(await ownsMessage(db, 'd'.repeat(32), 'a1', 'assistant')).toBe(false);
    expect(await ownsMessage(db, CHAT, 'nope', 'assistant')).toBe(false);
  });
});
