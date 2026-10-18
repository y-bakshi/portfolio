import type { Embedder } from '../llm/types';
import type { Chunk, VectorIndex } from './types';

export type Retrieved = { chunk: Chunk; score: number };

export type Retrieval = {
  /** Best first. */
  hits: Retrieved[];
  /** The best score, or 0 when nothing came back. */
  topScore: number;
};

export const RETRIEVE_K = 8;

/**
 * Finds the notes closest to the question. There is no reranking step: with a corpus this small
 * the vector order is good enough, and a rerank would change the scores the threshold relies on.
 */
export async function retrieve(
  question: string,
  deps: { embedder: Embedder; index: VectorIndex; chunks: Map<string, Chunk> },
  k = RETRIEVE_K,
): Promise<Retrieval> {
  const [vector] = await deps.embedder.embed([question]);
  if (!vector) return { hits: [], topScore: 0 };
  const found = await deps.index.query(vector, k);
  // a hit for a note that is no longer in the corpus is stale, so it is skipped
  const hits = found.flatMap((h) => {
    const chunk = deps.chunks.get(h.id);
    return chunk ? [{ chunk, score: h.score }] : [];
  });
  return { hits, topScore: hits[0]?.score ?? 0 };
}
