import { testDb } from '../test/sqlite-d1';
import { CACHE_TTL_MS, cachedAnswerer, normalise } from './answer-cache';
import type { AnswerResult, Answerer, Turn } from './answerer';

const PILL = 'What has Yash built with RAG?';

function setup(
  result: AnswerResult = {
    text: 'A real answer.',
    cites: ['testpilot'],
    meta: { model: 'gemini', costMicroUsd: 900 },
  },
) {
  const calls: { question: string; history: Turn[] }[] = [];
  const inner: Answerer = {
    answer: async (question, history) => {
      calls.push({ question, history });
      return result;
    },
  };
  let now = 1_000;
  const db = testDb();
  const answerer = cachedAnswerer(inner, {
    db,
    clock: () => now,
    version: 'v1',
    questions: [PILL, 'Show me his backend experience'],
  });
  return { answerer, calls, db, tick: (ms: number) => (now += ms) };
}

async function drain(a: Answerer, question: string, history: Turn[] = []) {
  const pieces: string[] = [];
  const gen = a.stream!(question, history);
  for (;;) {
    const step = await gen.next();
    if (step.done) return { text: pieces.join(''), result: step.value };
    pieces.push(step.value);
  }
}

describe('normalise', () => {
  it('ignores case, punctuation and spacing', () => {
    expect(normalise('  What has Yash built with RAG?  ')).toBe('what has yash built with rag');
    expect(normalise('what has yash   built with rag')).toBe(normalise(PILL));
  });
});

describe('the answer cache', () => {
  it('asks the model once for a suggestion question, then reads it back for free', async () => {
    const { answerer, calls } = setup();
    const first = await answerer.answer(PILL, []);
    const second = await answerer.answer(PILL, []);
    expect(calls).toHaveLength(1);
    expect(first.meta?.model).toBe('gemini');
    expect(second).toMatchObject({ text: 'A real answer.', cites: ['testpilot'] });
    expect(second.meta).toMatchObject({ model: 'cache', costMicroUsd: 0 });
  });

  it('matches the question however it is typed, and whichever page or chat it came from', async () => {
    const { answerer, calls } = setup();
    await answerer.answer(PILL, []);
    await answerer.answer(`The visitor is on the home page.\n${PILL}`, [
      { role: 'user', text: 'hi' },
    ]);
    await answerer.answer('what has yash built with rag', []);
    expect(calls).toHaveLength(1);
  });

  it('asks the model the bare question, without the page line or the chat so far', async () => {
    const { answerer, calls } = setup();
    await answerer.answer(`The visitor is on the home page.\n${PILL}`, [
      { role: 'user', text: 'hi' },
    ]);
    expect(calls[0]).toEqual({ question: PILL, history: [] });
  });

  it('leaves every other question alone, and passes everything through unchanged', async () => {
    const { answerer, calls } = setup();
    await answerer.answer('Tell me about Thryv', []);
    await answerer.answer('Tell me about Thryv', []);
    expect(calls).toHaveLength(2);
    expect(calls[0].question).toBe('Tell me about Thryv');
  });

  it('does not keep a failure or a "not in my notes"', async () => {
    for (const result of [
      { text: 'The guide cannot answer just now.', cites: [], meta: { model: 'unavailable' } },
      { text: 'That is not in my notes.', cites: [], meta: { model: 'gemini' } },
      { text: 'Refused', cites: [], meta: { model: 'none' } },
    ]) {
      const { answerer, calls } = setup(result);
      await answerer.answer(PILL, []);
      await answerer.answer(PILL, []);
      expect(calls).toHaveLength(2);
    }
  });

  it('forgets an answer after the time limit, and a changed version never sees an old one', async () => {
    const { answerer, calls, tick, db } = setup();
    await answerer.answer(PILL, []);
    tick(CACHE_TTL_MS + 1);
    await answerer.answer(PILL, []);
    expect(calls).toHaveLength(2);

    const other = cachedAnswerer(
      { answer: async () => ({ text: 'New.', cites: [], meta: { model: 'gemini' } }) },
      { db, clock: () => 5_000, version: 'v2', questions: [PILL] },
    );
    expect((await other.answer(PILL, [])).text).toBe('New.');
  });

  it('streams a saved answer as words, and a first answer as the model writes it', async () => {
    const { answerer, calls } = setup();
    const first = await drain(answerer, PILL);
    const again = await drain(answerer, PILL);
    expect(first.text).toBe('A real answer.');
    expect(again.text).toBe('A real answer.');
    expect(again.result.meta?.model).toBe('cache');
    expect(calls).toHaveLength(1);
  });

  it('still answers when the database fails', async () => {
    const { calls } = setup();
    const broken = {
      prepare: () => {
        throw new Error('down');
      },
      batch: async () => {
        throw new Error('down');
      },
    };
    const answerer = cachedAnswerer(
      {
        answer: async (q) => (
          calls.push({ question: q, history: [] }),
          { text: 'Fine.', cites: [], meta: { model: 'gemini' } }
        ),
      },
      { db: broken, clock: () => 1, version: 'v', questions: [PILL] },
    );
    expect((await answerer.answer(PILL, [])).text).toBe('Fine.');
  });
});
