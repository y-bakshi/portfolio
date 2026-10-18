import type { Env } from '../env';
import { createGemini } from './gemini';
import { createGeminiEmbedder } from './gemini-embed';
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
 * LLM_PROVIDER: 'gemini' (embeddings too; Workers AI as the chat fallback when bound), 'workers-ai' or 'mock'.
 */
export function fromEnv(env: Env, options: { fetch?: FetchLike } = {}): Models | null {
  const ai = env.AI ? aiLike(env.AI) : null;
  switch (env.LLM_PROVIDER) {
    case 'mock':
      return { provider: createMockProvider(), embedder: mockEmbedder };
    case 'workers-ai':
      return ai ? { provider: createWorkersAi(ai), embedder: createWorkersAiEmbedder(ai) } : null;
    case 'gemini': {
      if (!env.GEMINI_API_KEY) return null;
      const gemini = createGemini({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        fetch: options.fetch,
      });
      return {
        // Workers AI, when bound, is only the fallback for chat; the notes are embedded by Gemini
        provider: ai ? chain([gemini, createWorkersAi(ai)]) : gemini,
        embedder: createGeminiEmbedder({ apiKey: env.GEMINI_API_KEY, fetch: options.fetch }),
      };
    }
    default:
      return null;
  }
}
