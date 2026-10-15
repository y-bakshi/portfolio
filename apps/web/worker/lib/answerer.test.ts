// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { openAdmission } from './admission';
import { streamAnswer, wordPieces, type Answerer } from './answerer';

async function collect(gen: AsyncGenerator<string, unknown, void>) {
  const pieces: string[] = [];
  let step = await gen.next();
  while (!step.done) {
    pieces.push(step.value);
    step = await gen.next();
  }
  return { pieces, result: step.value };
}

describe('wordPieces', () => {
  it('splits text into words that keep their trailing space, so joining restores it', () => {
    const pieces = [...wordPieces('I built TestPilot.  It uses RAG.')];
    expect(pieces.join('')).toBe('I built TestPilot.  It uses RAG.');
    expect(pieces[0]).toBe('I ');
    expect(pieces.length).toBeGreaterThan(4);
  });

  it('gives nothing for empty text', () => {
    expect([...wordPieces('')]).toEqual([]);
  });
});

describe('streamAnswer', () => {
  const finished = { text: 'Hello there friend', cites: ['testpilot'] };

  it('streams a plain answerer by splitting its answer into words, and returns the answer', async () => {
    const answerer: Answerer = { answer: async () => finished };
    const { pieces, result } = await collect(streamAnswer(answerer, 'q', []));
    expect(pieces.join('')).toBe(finished.text);
    expect(result).toEqual(finished);
  });

  it('uses an answerer own stream when it has one', async () => {
    const answerer: Answerer = {
      answer: async () => {
        throw new Error('should not be called');
      },
      async *stream() {
        yield 'He';
        yield 'llo';
        return { text: 'Hello', cites: [] };
      },
    };
    const { pieces, result } = await collect(streamAnswer(answerer, 'q', []));
    expect(pieces).toEqual(['He', 'llo']);
    expect(result).toEqual({ text: 'Hello', cites: [] });
  });
});

describe('openAdmission', () => {
  it('lets a request through and accepts settling and releasing', async () => {
    const outcome = await openAdmission.admit(new Request('https://x.test'), {} as never, {
      kind: 'chat',
      maxCostMicroUsd: 1000,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      await outcome.settle(10);
      await outcome.release();
    }
  });
});
