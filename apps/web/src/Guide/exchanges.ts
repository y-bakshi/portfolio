import type { Exchange } from './Thread';
import type { SavedMessage } from './storage';

/** Pairs each question with the answer after it. A question with no answer yet is left out. */
export function toExchanges(messages: SavedMessage[]): Exchange[] {
  const out: Exchange[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const [question, answer] = [messages[i], messages[i + 1]];
    if (question.role !== 'user' || answer.role !== 'assistant') continue;
    out.push({
      q: question.text,
      text: answer.text,
      cites: answer.cites,
      id: answer.id,
      rating: answer.rating ?? null,
    });
    i++;
  }
  return out;
}

/** Flattens exchanges back into messages, for the browser copy. */
export function toMessages(exchanges: Exchange[]): SavedMessage[] {
  return exchanges.flatMap((e) => [
    { role: 'user' as const, text: e.q, cites: [] },
    { role: 'assistant' as const, text: e.text, cites: e.cites, id: e.id, rating: e.rating },
  ]);
}
