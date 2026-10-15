import type { Env } from '../env';
import type { Answerer } from '../lib/answerer';
import { fromEnv } from '../llm';
import { createRagAnswerer, keywordResult, type RagOptions } from './answer';

/** The keyword guide as an Answerer: no model, no cost. */
export const keywordAnswerer: Answerer = {
  answer: async (question) => keywordResult(question),
};

/**
 * The answerer the chat route should use: the retrieval-backed model when LLM_PROVIDER and its
 * bindings are set up, otherwise the keyword guide.
 */
export function createAnswerer(env: Env, options: RagOptions = {}): Answerer {
  const models = options.models ?? fromEnv(env);
  if (!models) return keywordAnswerer;
  return createRagAnswerer(env, { ...options, models });
}
