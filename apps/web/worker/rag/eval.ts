import type { Env } from '../env';
import type { Embedder } from '../llm/types';
import { createRagAnswerer } from './answer';
import { buildChunks } from './chunks';
import { CapError } from './eval-cap';
import { score } from './eval-score';
import type { EvalDeps, EvalQuestion, EvalReport } from './eval-types';
import { createMemoryIndex } from './indexes';
import type { Chunk, VectorIndex } from './types';

export { capped, CapError } from './eval-cap';
export { parseQuestions } from './eval-types';
export type { EvalDeps, EvalQuestion, EvalReport } from './eval-types';

/** Embeds every note into a memory index, the way the indexer would for a real one. */
export async function memoryIndexFor(embedder: Embedder, chunks: Chunk[]): Promise<VectorIndex> {
  const index = createMemoryIndex();
  const vectors = await embedder.embed(chunks.map((c) => `${c.title}\n${c.text}`));
  await index.upsert(chunks.map((c, i) => ({ ...c, vector: vectors[i]! })));
  return index;
}

/** Runs the questions through the retrieval answerer, and optionally through the baseline. */
export async function runEval(
  questions: EvalQuestion[],
  deps: EvalDeps,
  k = 8,
): Promise<{ rag: EvalReport; baseline?: EvalReport }> {
  const chunks = deps.chunks ?? buildChunks();
  const models = { provider: deps.provider, embedder: deps.embedder };
  const env = {} as Env;
  // a cap must stop the run, not turn into keyword answers that look like results
  const onError = (e: unknown) => {
    if (e instanceof CapError) throw e;
  };
  const base = { models, index: deps.index, chunks, onError };
  const rag = createRagAnswerer(env, { ...base, minScore: deps.minScore });
  const full = { ...deps, chunks };
  const report = { rag: await score(questions, rag, full, k) } as {
    rag: EvalReport;
    baseline?: EvalReport;
  };
  if (deps.baseline) {
    // no threshold and every note in the prompt: what retrieval has to beat
    const all = createRagAnswerer(env, { ...base, minScore: -1, notesInPrompt: chunks.length });
    report.baseline = await score(questions, all, { ...full, judge: undefined }, k);
  }
  return report;
}
