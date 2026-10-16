import type { Ai } from '@cloudflare/workers-types';
import {
  costMicroUsd,
  PROVIDER_TIMEOUT_MS,
  WORKERS_AI_CHAT_MODEL,
  WORKERS_AI_EMBED_DIMENSIONS,
  WORKERS_AI_EMBED_MODEL,
  WORKERS_AI_PRICE,
} from './constants';
import { sseData } from './sse';
import type { ChatRequest, ChatResult, Embedder, FetchLike, LlmProvider } from './types';

/** The one method of the Workers AI binding used here, so tests can pass a plain object. */
export type AiLike = { run(model: string, input: unknown): Promise<unknown> };

/** The binding's own types list every model; this narrows it to what the adapters call. */
export const aiLike = (ai: Ai): AiLike => ai as unknown as AiLike;

type Reply = { response?: string; usage?: { prompt_tokens?: number; completion_tokens?: number } };

// a rough count for when the model reports none: about four characters a token
const guess = (text: string) => Math.ceil(text.length / 4);

function input(request: ChatRequest, stream: boolean) {
  return {
    messages: request.messages,
    max_tokens: request.maxOutputTokens ?? 400,
    temperature: request.temperature ?? 0.2,
    ...(stream && { stream: true }),
  };
}

function finish(request: ChatRequest, text: string, usage: Reply['usage']): ChatResult {
  const inputTokens =
    usage?.prompt_tokens ?? guess(request.messages.map((m) => m.content).join('\n'));
  const outputTokens = usage?.completion_tokens ?? guess(text);
  return {
    text,
    model: WORKERS_AI_CHAT_MODEL,
    inputTokens,
    outputTokens,
    costMicroUsd: costMicroUsd(WORKERS_AI_PRICE, inputTokens, outputTokens),
  };
}

/** Fails if the model takes too long, so the caller can move on. */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('workers-ai timeout')), ms);
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
}

/** The Workers AI chat model, used as the fallback when the main provider fails. */
export function createWorkersAi(ai: AiLike, timeoutMs = PROVIDER_TIMEOUT_MS): LlmProvider {
  return {
    async chat(request) {
      const reply = (await withTimeout(
        ai.run(WORKERS_AI_CHAT_MODEL, input(request, false)),
        timeoutMs,
      )) as Reply;
      if (!reply.response) throw new Error('workers-ai empty reply');
      return finish(request, reply.response, reply.usage);
    },
    async *chatStream(request) {
      const out = await withTimeout(ai.run(WORKERS_AI_CHAT_MODEL, input(request, true)), timeoutMs);
      if (!(out instanceof ReadableStream)) throw new Error('workers-ai no stream');
      let text = '';
      let usage: Reply['usage'];
      for await (const data of sseData(out as ReadableStream<Uint8Array>)) {
        if (data === '[DONE]') break;
        const part = JSON.parse(data) as Reply;
        if (part.usage) usage = part.usage;
        if (part.response) {
          text += part.response;
          yield part.response;
        }
      }
      if (!text) throw new Error('workers-ai empty reply');
      return finish(request, text, usage);
    },
  };
}

/** Workers AI over its REST API, for scripts and the live eval that run outside a Worker. */
export function restAi(account: string, token: string, doFetch: FetchLike = fetch): AiLike {
  return {
    async run(model, input) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
      const res = await doFetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`workers-ai ${res.status}`);
      return ((await res.json()) as { result: unknown }).result;
    },
  };
}

const BATCH = 50;

/** bge embeddings from Workers AI. The model is small and fast; vectors are 768 numbers. */
export function createWorkersAiEmbedder(ai: AiLike): Embedder {
  return {
    dimensions: WORKERS_AI_EMBED_DIMENSIONS,
    // a starting guess for bge cosine scores; tune it with the live eval before trusting it
    suggestedMinScore: 0.5,
    async embed(texts) {
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH) {
        const out = (await ai.run(WORKERS_AI_EMBED_MODEL, { text: texts.slice(i, i + BATCH) })) as {
          data?: number[][];
        };
        if (!out.data || out.data.length !== Math.min(BATCH, texts.length - i))
          throw new Error('workers-ai embedding failed');
        vectors.push(...out.data);
      }
      return vectors;
    },
  };
}
