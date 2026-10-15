import type { Env } from '../env';
import { createGemini } from './gemini';
import { createMockProvider, mockEmbedder } from './mock';
import type { ChatRequest, Embedder, FetchLike, LlmProvider } from './types';
import { aiLike, createWorkersAi, createWorkersAiEmbedder } from './workersai';

export type { ChatMessage, ChatRequest, ChatResult, Embedder, LlmProvider } from './types';

/** Tries each provider in turn: the next one is used when the one before throws or times out. */
export function chain(providers: LlmProvider[]): LlmProvider {
  return {
    async chat(request: ChatRequest) {
      let last: unknown;
      for (const p of providers) {
        try {
          return await p.chat(request);
        } catch (error) {
          last = error;
        }
      }
      throw last ?? new Error('no provider');
    },
    async *chatStream(request: ChatRequest) {
      let last: unknown;
      for (const p of providers) {
        let started = false;
        try {
          const source = p.chatStream ? p.chatStream(request) : null;
          if (!source) return await p.chat(request);
          for (;;) {
            const step = await source.next();
            if (step.done) return step.value;
            started = true;
            yield step.value;
          }
        } catch (error) {
          // once text has gone out, switching model would splice two answers together
          if (started) throw error;
          last = error;
        }
      }
      throw last ?? new Error('no provider');
    },
  };
}

export type Models = { provider: LlmProvider; embedder: Embedder };

/**
 * Picks the chat model and the embedder from the environment, or returns null when none is set up.
 * LLM_PROVIDER: 'gemini' (then Workers AI as the fallback), 'workers-ai' or 'mock'.
 */
export function fromEnv(env: Env, options: { fetch?: FetchLike } = {}): Models | null {
  const ai = env.AI ? aiLike(env.AI) : null;
  switch (env.LLM_PROVIDER) {
    case 'mock':
      return { provider: createMockProvider(), embedder: mockEmbedder };
    case 'workers-ai':
      return ai ? { provider: createWorkersAi(ai), embedder: createWorkersAiEmbedder(ai) } : null;
    case 'gemini': {
      // embeddings come from Workers AI, so a Gemini setup without the binding cannot retrieve
      if (!env.GEMINI_API_KEY || !ai) return null;
      const gemini = createGemini({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        fetch: options.fetch,
      });
      return {
        provider: chain([gemini, createWorkersAi(ai)]),
        embedder: createWorkersAiEmbedder(ai),
      };
    }
    default:
      return null;
  }
}
