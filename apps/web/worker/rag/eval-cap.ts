import type { Embedder, LlmProvider } from '../llm/types';

export class CapError extends Error {}

/** Counts calls to the model and the embedder and stops the run when a cap is reached. */
export function capped(
  provider: LlmProvider,
  embedder: Embedder,
  maxCalls: number,
): { provider: LlmProvider; embedder: Embedder; calls: () => number } {
  let calls = 0;
  const tick = () => {
    if (++calls > maxCalls) throw new CapError(`provider call cap of ${maxCalls} reached`);
  };
  const cache = new Map<string, number[]>();
  return {
    calls: () => calls,
    provider: {
      chat: (r) => (tick(), provider.chat(r)),
      ...(provider.chatStream && { chatStream: (r) => (tick(), provider.chatStream!(r)) }),
    },
    embedder: {
      ...embedder,
      // a question is embedded once, however many times it is looked at
      async embed(texts) {
        const out: number[][] = [];
        for (const t of texts) {
          let v = cache.get(t);
          if (!v) {
            tick();
            v = (await embedder.embed([t]))[0]!;
            cache.set(t, v);
          }
          out.push(v);
        }
        return out;
      },
    },
  };
}
