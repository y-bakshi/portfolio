// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { clampDays, getSummary, percentile } from './stats';
import { recordEvent, type EventInput } from './events';
import { testDb, type TestDb } from '../test/sqlite-d1';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 14, 12);
const ago = (days: number, hours = 0) => NOW - days * DAY - hours * 3_600_000;

let db: TestDb;
let t = NOW;
const at = (ms: number) => () => ms;
const event = (input: EventInput, when: number) => recordEvent(db, at(when), input);

let seq = 0;
/** One question and its answer, as the chat route would store them. */
function exchange(
  chat: string,
  n: number,
  when: number,
  question: string,
  answer: { text: string; cites?: string[]; score?: number | null },
) {
  const insert = db.raw.prepare(
    `INSERT INTO messages (id, chat_id, seq, role, text, cites_json, top_score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insert.run(`m${++seq}`, chat, n, 'user', question, '[]', null, when);
  insert.run(
    `m${++seq}`,
    chat,
    n + 1,
    'assistant',
    answer.text,
    JSON.stringify(answer.cites ?? []),
    answer.score ?? null,
    when + 1000,
  );
  return `m${seq}`;
}

beforeEach(async () => {
  db = testDb();
  t = NOW;
  seq = 0;
  for (const id of ['c1', 'c2', 'c3']) {
    db.raw
      .prepare('INSERT INTO chats (id, created_at, last_seen_at) VALUES (?, ?, ?)')
      .run(id, ago(2), ago(2));
  }
  // three chats, five questions in range, one older than the window
  await event({ type: 'chat_started', chatId: 'c1' }, ago(5));
  await event({ type: 'chat_started', chatId: 'c2' }, ago(1));
  await event({ type: 'chat_started', chatId: 'c3' }, ago(1, 2));
  await event({ type: 'chat_started', chatId: 'old' }, ago(60));
  for (const [when, ms, cost] of [
    [ago(5), 700, 900],
    [ago(1), 900, 1100],
    [ago(1, 1), 1500, 1300],
    [ago(0, 3), 2400, 1000],
    [ago(60), 99999, 5000],
  ]) {
    await event({ type: 'question_asked', chatId: 'c1' }, when);
    await event(
      {
        type: 'answer_shown',
        chatId: 'c1',
        data: { latencyMs: ms, costMicroUsd: cost, topScore: 0.8 },
      },
      when + 500,
    );
  }
  await event({ type: 'fallback_used', chatId: 'c2', data: { reason: 'budget' } }, ago(1));
  await event({ type: 'rate_limited', chatId: 'c2' }, ago(1));
  await event({ type: 'rate_limited' }, ago(0, 1));

  exchange('c1', 1, ago(5), ' How does TestPilot work? ', {
    text: 'It plans.',
    cites: ['testpilot'],
    score: 0.82,
  });
  exchange('c2', 1, ago(1), 'how does testpilot work?', {
    text: 'It plans.',
    cites: ['testpilot'],
    score: 0.8,
  });
  exchange('c2', 3, ago(1, 1), 'What is your salary?', {
    text: 'That is not in my notes.',
    score: 0.2,
  });
  exchange('c3', 1, ago(0, 5), 'Do you know Rust?', {
    text: 'A little.',
    cites: ['catscript'],
    score: 0.35,
  });
  exchange('c3', 3, ago(0, 3), 'Where did you graduate?', {
    text: 'That is not in my notes.',
    score: null,
  });
  exchange('c3', 5, ago(40), 'Ancient question', { text: 'x', score: 0.1 });
  const id = db.raw.prepare("SELECT id FROM messages WHERE text = 'It plans.' LIMIT 1").get() as {
    id: string;
  };
  db.raw.prepare('INSERT INTO feedback VALUES (?, 1, ?)').run(id.id, ago(1));
  db.raw.prepare('INSERT INTO feedback VALUES (?, -1, ?)').run('m4', ago(1));
  db.raw.prepare('INSERT INTO feedback VALUES (?, 1, ?)').run('m6', ago(2));
});

describe('getSummary', () => {
  it('counts totals inside the window only', async () => {
    const s = await getSummary(db, at(t));
    expect(s.range.days).toBe(30);
    expect(s.totals).toEqual({ chats: 3, questions: 4, answers: 4 });
    expect(s.rateLimited).toBe(2);
  });

  it('gives a point for every day, with questions, answers and cost', async () => {
    const s = await getSummary(db, at(t), { days: 7 });
    expect(s.daily).toHaveLength(8);
    const yesterday = s.daily.find((d) => d.day === '2026-10-13')!;
    expect(yesterday).toMatchObject({ questions: 2, answers: 2, costMicroUsd: 2400 });
    expect(s.daily.find((d) => d.day === '2026-10-10')).toMatchObject({
      questions: 0,
      costMicroUsd: 0,
    });
    expect(s.costMicroUsd).toBe(900 + 1100 + 1300 + 1000);
  });

  it('computes latency percentiles by nearest rank', async () => {
    const s = await getSummary(db, at(t));
    expect(s.latencyMs).toEqual({ p50: 900, p95: 2400 });
    expect(percentile([], 50)).toBeNull();
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10);
  });

  it('reports the thumbs ratio and the fallback rate', async () => {
    const s = await getSummary(db, at(t));
    expect(s.thumbs).toEqual({ up: 2, down: 1, upRatio: 2 / 3 });
    expect(s.fallbackRate).toBe(1 / 4);
  });

  it('has no ratios, rather than NaN, when nothing happened', async () => {
    const s = await getSummary(testDb(), at(t));
    expect(s.thumbs.upRatio).toBeNull();
    expect(s.fallbackRate).toBeNull();
    expect(s.latencyMs).toEqual({ p50: null, p95: null });
    expect(s.topQuestions).toEqual([]);
  });

  it('groups identical questions after lowercasing and trimming', async () => {
    const s = await getSummary(db, at(t));
    expect(s.topQuestions[0]).toEqual({ text: 'how does testpilot work?', count: 2 });
    expect(s.topQuestions.map((q) => q.text)).not.toContain('ancient question');
  });

  it('lists weak answers and refusals, newest first, with score and date', async () => {
    const s = await getSummary(db, at(t));
    expect(s.lowConfidence.map((q) => q.text)).toEqual([
      'Where did you graduate?',
      'Do you know Rust?',
      'What is your salary?',
    ]);
    expect(s.lowConfidence[1]).toMatchObject({ score: 0.35, refused: false });
    expect(s.lowConfidence[1].at).toBe(new Date(ago(0, 5)).toISOString());
    const refused = s.lowConfidence.find((q) => q.text === 'Where did you graduate?');
    expect(refused).toMatchObject({ score: null, refused: true });
    // strong answers and answers outside the window are left out
    expect(s.lowConfidence.map((q) => q.text)).not.toContain('Ancient question');
    expect(s.lowConfidence).toHaveLength(3);
  });

  it('widens the window with days, and clamps it', async () => {
    expect((await getSummary(db, at(t), { days: 90 })).totals.questions).toBe(5);
    expect(clampDays('abc')).toBe(30);
    expect(clampDays(0)).toBe(30);
    expect(clampDays(500)).toBe(90);
    expect(clampDays('7')).toBe(7);
  });
});
