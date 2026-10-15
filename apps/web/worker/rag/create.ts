import type { Env } from '../env';
import type { Answerer } from '../lib/answerer';
import { fromEnv } from '../llm';
import { createRagAnswerer, unavailableResult, type RagOptions } from './answer';

/** The Answerer for a site with no model set up: it only says it cannot answer. */
export const unavailableAnswerer: Answerer = {
  answer: async () => unavailableResult(),
};

/**
 * The answerer the chat route should use: the retrieval-backed model when LLM_PROVIDER and its
 * bindings are set up, otherwise one that says it cannot answer.
 */
export function createAnswerer(env: Env, options: RagOptions = {}): Answerer {
  const models = options.models ?? fromEnv(env);
  if (!models) return unavailableAnswerer;
  return createRagAnswerer(env, { ...options, models });
}
