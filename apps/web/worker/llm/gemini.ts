import {
  costMicroUsd,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_PRICE,
  PRICES,
  PROVIDER_TIMEOUT_MS,
} from './constants';
import { retryOnce } from './retry';
import { sseData } from './sse';
import type { ChatRequest, ChatResult, FetchLike, LlmProvider } from './types';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiOptions = {
  apiKey: string;
  model?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
};

type Usage = { promptTokenCount?: number; candidatesTokenCount?: number };
type Part = { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: Usage };

/** Gemini speaks 'user' and 'model', and keeps the system prompt apart from the turns. */
function body(request: ChatRequest) {
  const system = request.messages.filter((m) => m.role === 'system').map((m) => m.content);
  return JSON.stringify({
    ...(system.length && { systemInstruction: { parts: [{ text: system.join('\n\n') }] } }),
    contents: request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    generationConfig: {
      maxOutputTokens: request.maxOutputTokens ?? 400,
      temperature: request.temperature ?? 0.2,
    },
  });
}

const textOf = (part: Part) =>
  (part.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');

/** The Gemini REST API over fetch. The key goes in a header; nothing here logs a prompt or a key. */
export function createGemini(options: GeminiOptions): LlmProvider {
  const model = options.model || DEFAULT_GEMINI_MODEL;
  const doFetch = retryOnce(options.fetch ?? ((url, init) => fetch(url, init)));
  const price = PRICES[model] ?? FALLBACK_PRICE;

  async function call(method: string, request: ChatRequest) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? PROVIDER_TIMEOUT_MS);
    try {
      const url = `${BASE}/${encodeURIComponent(model)}:${method}`;
      const res = await doFetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': options.apiKey },
        body: body(request),
        signal: controller.signal,
      });
      // only the status goes into the error: the body could echo the prompt
      if (!res.ok) throw new Error(`gemini ${res.status}`);
      return { res, stop: () => clearTimeout(timer) };
    } catch (error) {
      clearTimeout(timer);
      throw error;
    }
  }

  const finish = (text: string, usage: Usage): ChatResult => {
    const inputTokens = usage.promptTokenCount ?? 0;
    const outputTokens = usage.candidatesTokenCount ?? 0;
    return {
      text,
      model,
      inputTokens,
      outputTokens,
      costMicroUsd: costMicroUsd(price, inputTokens, outputTokens),
    };
  };

  return {
    async chat(request) {
      const { res, stop } = await call('generateContent', request);
      try {
        const part = (await res.json()) as Part;
        const text = textOf(part);
        if (!text) throw new Error('gemini empty reply');
        return finish(text, part.usageMetadata ?? {});
      } finally {
        stop();
      }
    },
    async *chatStream(request) {
      const { res, stop } = await call('streamGenerateContent?alt=sse', request);
      let text = '';
      let usage: Usage = {};
      try {
        if (!res.body) throw new Error('gemini no body');
        for await (const data of sseData(res.body)) {
          const part = JSON.parse(data) as Part;
          if (part.usageMetadata) usage = part.usageMetadata;
          const piece = textOf(part);
          if (piece) {
            text += piece;
            yield piece;
          }
        }
      } finally {
        stop();
      }
      if (!text) throw new Error('gemini empty reply');
      return finish(text, usage);
    },
  };
}
