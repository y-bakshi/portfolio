import { createReveal, wordsOf } from './reveal';
import { toExchanges, toMessages } from './exchanges';

describe('wordsOf', () => {
  it('keeps trailing spaces so the words join back into the text', () => {
    expect(wordsOf('a bc  d').join('')).toBe('a bc  d');
    expect(wordsOf('')).toEqual([]);
  });
});

describe('createReveal', () => {
  it('shows the first piece at once and the rest at a steady pace', async () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const reveal = createReveal((t) => seen.push(t), 28);
    ['a ', 'b ', 'c'].forEach((p) => reveal.push(p));
    expect(seen).toEqual(['a ']);
    await vi.advanceTimersByTimeAsync(28);
    expect(seen).toEqual(['a ', 'a b ']);
    const drained = reveal.drained();
    await vi.advanceTimersByTimeAsync(100);
    await drained;
    expect(seen.at(-1)).toBe('a b c');
  });

  it('stops when cancelled', async () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const reveal = createReveal((t) => seen.push(t), 28);
    reveal.push('a ');
    reveal.push('b ');
    reveal.cancel();
    await vi.advanceTimersByTimeAsync(200);
    expect(seen).toEqual(['a ']);
  });
});

describe('exchanges', () => {
  it('pairs questions with answers, drops an unanswered question, and round-trips', () => {
    const messages = [
      { role: 'user' as const, text: 'q1', cites: [] },
      { role: 'assistant' as const, text: 'a1', cites: ['x'], id: 'a1', rating: 1 as const },
      { role: 'user' as const, text: 'q2', cites: [] },
    ];
    const exchanges = toExchanges(messages);
    expect(exchanges).toEqual([{ q: 'q1', text: 'a1', cites: ['x'], id: 'a1', rating: 1 }]);
    expect(toMessages(exchanges)).toHaveLength(2);
  });
});
