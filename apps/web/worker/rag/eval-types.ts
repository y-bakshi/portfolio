import type { Embedder, LlmProvider } from '../llm/types';
import type { Chunk, VectorIndex } from './types';

/** One required fact: a text, or a list of texts of which any one will do (for example "8" or "eight"). */
export type Needed = string | string[];

export type EvalQuestion = {
  id: string;
  /**
   * `unsupported` is about Yash but not in the notes, so the guide should refuse and point to him.
   * `offtopic` and `injection` should be refused with no pointer. `partial` is covered in part:
   * the guide should answer that part and say what is missing.
   */
  category: 'recruiter' | 'architecture' | 'unsupported' | 'offtopic' | 'injection' | 'partial';
  question: string;
  /** Source ids the answer comes from. Context recall is the share of them that were retrieved. */
  expect?: string[];
  /** Related cards that are fine to retrieve, so they do not count as noise in context precision. */
  acceptableSources?: string[];
  /** True when the notes cannot answer it and the guide must say so. */
  unsupported?: boolean;
  /** Texts a correct answer must contain, each one a text or a list of alternatives. */
  mustInclude?: Needed[];
  /** Texts that would show an invented or unsafe answer. */
  mustNotInclude?: string[];
  /** For a partial question: words that name the part the notes do not cover. */
  missing?: string[];
};

export function parseQuestions(jsonl: string): EvalQuestion[] {
  return jsonl
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as EvalQuestion);
}

/** A count of passes out of a count of checks, so a run's results can be pooled and printed. */
export type Share = { pass: number; of: number };

export type EvalReport = {
  questions: number;
  /** Answerable questions with an expected source among the top k retrieved. */
  hitRateAtK: number;
  hitRateAt4: number;
  /** Context recall: the share of a question's expected sources that were retrieved (top k). */
  contextRecall: number;
  /** Context precision: the share of the notes sent to the model that come from a wanted source. */
  contextPrecision: number;
  /** Answers whose every cite is a page card that was retrieved (the contact pointer is exempt). */
  citationValidity: number;
  /** Cited cards whose note shares distinctive terms with the answer's claims. */
  citationAccuracy: number;
  /** Answerable questions whose answer cites at least one expected card. */
  citesExpected: number;
  /** Answers with every mustInclude present and no mustNotInclude. */
  answerCorrectness: number;
  /** Claim sentences whose content words are in the notes or the question. */
  faithfulness: number;
  /** Answers that address the question (or refuse an unsupported one). */
  answerRelevancy: number;
  /** Questions where the pointer to Yash is present exactly when it should be. */
  gapHandling: number;
  /** Refusals that wrongly carried the pointer (off-topic and injection questions). */
  falsePointers: number;
  /** Partial questions answered with the missing part named and the pointer. Nothing to judge with a mock. */
  partialNamed: number;
  /** Questions where the guide refused exactly when it should (partial questions are left out). */
  refusalCorrectness: number;
  refusedWhenUnsupported: number;
  answeredWhenSupported: number;
  /** Answers where the guide could not answer because the model path failed. */
  fallbacks: number;
  latencyMs: { p50: number; p95: number; total: number };
  cost: {
    totalMicroUsd: number;
    perQuestionMicroUsd: number;
    inputTokens: number;
    outputTokens: number;
  };
  /** Only in a live run with the judge on. */
  judge?: { faithfulness: number; relevancy: number; partialNamed: number | null; judged: number };
  providerCalls: number;
  failures: string[];
};

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
  /** A model to grade the answers with (live runs). Pass the capped provider so its calls count. */
  judge?: LlmProvider;
  /** The clock for latency, in milliseconds. Tests pass their own. */
  now?: () => number;
};
