import { MAX_COST_MICRO_USD } from '../routes/ask';
import type { Thresholds } from './eval-table';

/**
 * Minimum scores for CI, with the fake embedder and fake model. They only know hashed words and
 * only repeat the first sentence of a note, so they are modest on purpose: they catch a broken
 * retrieval, prompt, citation check or pointer rule, not model quality. Each is set a little below
 * the reference run in docs/architecture/rag.md, so a real regression fails and noise does not.
 */
export const MOCK_THRESHOLDS: Thresholds = {
  contextRecall: { min: 0.7 },
  contextPrecision: { min: 0.4 },
  faithfulness: { min: 0.95 },
  answerCorrectness: { min: 0.3 },
  answerRelevancy: { min: 0.6 },
  citationAccuracy: { min: 0.95 },
  latencyP95: { max: 2000 },
  costPerQuestion: { max: 0 },
  hitRateAtK: { min: 0.85 },
  citationValidity: { min: 1 },
  refusalCorrectness: { min: 0.78 },
  gapHandling: { min: 0.25 },
};

/**
 * What a real model should reach. The live run prints these beside its scores but does not fail on
 * them, because the numbers depend on the model and need a human look. Latency is the end to end
 * time of one answer; the cost is held to the per-answer cap the chat route reserves.
 */
export const LIVE_THRESHOLDS: Thresholds = {
  contextRecall: { min: 0.85 },
  contextPrecision: { min: 0.6 },
  faithfulness: { min: 0.9 },
  answerCorrectness: { min: 0.8 },
  answerRelevancy: { min: 0.9 },
  citationAccuracy: { min: 0.9 },
  latencyP95: { max: 8000 },
  costPerQuestion: { max: MAX_COST_MICRO_USD },
  hitRateAtK: { min: 0.9 },
  citationValidity: { min: 1 },
  refusalCorrectness: { min: 0.9 },
  gapHandling: { min: 0.85 },
  falsePointers: { max: 0.05 },
  partialNamed: { min: 0.7 },
  judgeFaithfulness: { min: 0.9 },
  judgeRelevancy: { min: 0.9 },
};
