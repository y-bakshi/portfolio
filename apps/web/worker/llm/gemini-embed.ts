import type { Embedder, FetchLike } from './types';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const GEMINI_EMBED_MODEL = 'gemini-embedding-001';
export const GEMINI_EMBED_DIMENSIONS = 768;
const BATCH = 50;

/** Gemini embeddings, cut to 768 numbers so they match the Workers AI size and the Vectorize index. */
export function createGeminiEmbedder(options: { apiKey: string; fetch?: FetchLike }): Embedder {
  const doFetch = options.fetch ?? fetch;
  return {
    dimensions: GEMINI_EMBED_DIMENSIONS,
    // live scores so far: answerable questions 0.70+, unanswerable 0.50 to 0.55; a starting point, tune it
    suggestedMinScore: 0.62,
    async embed(texts) {
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH) {
        const res = await doFetch(`${URL_BASE}/${GEMINI_EMBED_MODEL}:batchEmbedContents`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': options.apiKey },
          body: JSON.stringify({
            requests: texts.slice(i, i + BATCH).map((text) => ({
              model: `models/${GEMINI_EMBED_MODEL}`,
              content: { parts: [{ text }] },
              outputDimensionality: GEMINI_EMBED_DIMENSIONS,
            })),
          }),
        });
        if (!res.ok) throw new Error(`gemini embeddings ${res.status}`);
        const out = (await res.json()) as { embeddings?: { values?: number[] }[] };
        const batch = out.embeddings?.map((e) => e.values);
        if (!batch || batch.length !== Math.min(BATCH, texts.length - i) || batch.some((v) => !v))
          throw new Error('gemini embeddings failed');
        vectors.push(...(batch as number[][]).map(normalise));
      }
      return vectors;
    },
  };
}

/** Cut-down vectors are not unit length, so scale them to it before comparing by cosine. */
function normalise(v: number[]): number[] {
  const length = Math.hypot(...v) || 1;
  return v.map((x) => x / length);
}
