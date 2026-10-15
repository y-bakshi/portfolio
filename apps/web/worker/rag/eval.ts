import type { Env } from '../env';
import type { AnswerResult, Answerer } from '../lib/answerer';
import type { Embedder, LlmProvider } from '../llm/types';
import { createRagAnswerer } from './answer';
import { buildChunks, registryIds } from './chunks';
import { createMemoryIndex } from './indexes';
import { retrieve } from './retrieve';
import type { Chunk, VectorIndex } from './types';

export type EvalQuestion = {
  id: string;
  category: 'recruiter' | 'architecture' | 'unsupported' | 'offtopic' | 'injection';
  question: string;
  /** Source ids that should be among the retrieved notes. Absent for questions to be refused. */
  expect?: string[];
  /** True when the notes cannot answer it and the guide must say so. */
  unsupported?: boolean;
};

export function parseQuestions(jsonl: string): EvalQuestion[] {
  return jsonl
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as EvalQuestion);
}

export type EvalReport = {
  questions: number;
  /** Supported questions with an expected source among the top k retrieved. */
  hitRateAtK: number;
  hitRateAt4: number;
  /** Answers whose every cite is a page card that was among the notes given to the model. */
  citationValidity: number;
  /** Supported answers that cite at least one of the expected cards. */
  citationAccuracy: number;
  /** Questions where the guide refused exactly when it should. */
  refusalCorrectness: number;
  /** Unsupported questions refused. */
  refusedWhenUnsupported: number;
  /** Supported questions answered. */
  answeredWhenSupported: number;
  /** Answers that came from the keyword fallback because the model path failed. */
  fallbacks: number;
  providerCalls: number;
  failures: string[];
};

const refused = (r: AnswerResult) => /not in my notes/i.test(r.text);
const ratio = (n: number, d: number) => (d ? n / d : 1);

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

export type EvalDeps = {
  provider: LlmProvider;
  embedder: Embedder;
  index: VectorIndex;
  chunks?: Chunk[];
  minScore?: number;
  /** Counts calls for the report; set by `capped`. */
  calls?: () => number;
  /** Also run the "all notes in the prompt, no retrieval" baseline and return its report. */
  baseline?: boolean;
};

/** Embeds every note into a memory index, the way the indexer would for a real one. */
export async function memoryIndexFor(embedder: Embedder, chunks: Chunk[]): Promise<VectorIndex> {
  const index = createMemoryIndex();
  const vectors = await embedder.embed(chunks.map((c) => `${c.title}\n${c.text}`));
  await index.upsert(chunks.map((c, i) => ({ ...c, vector: vectors[i]! })));
  return index;
}

async function score(
  questions: EvalQuestion[],
  answerer: Answerer,
  deps: Required<Pick<EvalDeps, 'chunks'>> & EvalDeps,
  k: number,
): Promise<EvalReport> {
  const byId = new Map(deps.chunks.map((c) => [c.id, c]));
  const failures: string[] = [];
  let hits = 0,
    hits4 = 0,
    supported = 0,
    valid = 0,
    accurate = 0,
    right = 0,
    ref = 0,
    ans = 0,
    unsupportedN = 0,
    fallbacks = 0;

  for (const q of questions) {
    const result = await answerer.answer(q.question, []);
    if (result.meta?.model === 'keyword') {
      fallbacks++;
      failures.push(`${q.id}: the keyword fallback answered`);
    }
    const given = new Set((result.meta?.retrievalIds ?? []).map((id) => byId.get(id)?.sourceId));
    // the contact card on a refusal is the way forward, not a claim, so it was never retrieved
    const way = (c: string) => c === 'contact' && refused(result);
    const citesOk = result.cites.every((c) => registryIds.has(c) && (given.has(c) || way(c)));
    if (citesOk) valid++;
    else failures.push(`${q.id}: a citation was not a retrieved card (${result.cites.join(', ')})`);

    const didRefuse = refused(result);
    if (didRefuse === Boolean(q.unsupported)) right++;
    else failures.push(`${q.id}: ${q.unsupported ? 'should have refused' : 'refused wrongly'}`);

    if (q.unsupported) {
      unsupportedN++;
      if (didRefuse) ref++;
      continue;
    }
    supported++;
    if (!didRefuse) ans++;
    const want = new Set(q.expect ?? []);
    if (result.cites.some((c) => want.has(c))) accurate++;
    const found = await retrieve(
      q.question,
      { embedder: deps.embedder, index: deps.index, chunks: byId },
      k,
    );
    const sources = found.hits.map((h) => h.chunk.sourceId);
    if (sources.some((s) => want.has(s))) hits++;
    if (sources.slice(0, 4).some((s) => want.has(s))) hits4++;
  }
  return {
    questions: questions.length,
    hitRateAtK: ratio(hits, supported),
    hitRateAt4: ratio(hits4, supported),
    citationValidity: ratio(valid, questions.length),
    citationAccuracy: ratio(accurate, supported),
    refusalCorrectness: ratio(right, questions.length),
    refusedWhenUnsupported: ratio(ref, unsupportedN),
    answeredWhenSupported: ratio(ans, supported),
    fallbacks,
    providerCalls: deps.calls?.() ?? 0,
    failures,
  };
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
    report.baseline = await score(questions, all, full, k);
  }
  return report;
}
