import { answerFor } from '../../src/content/answers';
import type { Env } from '../env';
import { wordPieces, type AnswerResult, type Answerer, type Turn } from '../lib/answerer';
import { fromEnv, type Models } from '../llm';
import type { ChatRequest, ChatResult } from '../llm/types';
import { buildChunks, registryIds } from './chunks';
import { MarkerStripper, stripMarkers, validateCites } from './citations';
import { indexFromEnv } from './indexes';
import { buildMessages, NOT_IN_NOTES } from './prompt';
import { retrieve, type Retrieval } from './retrieve';
import type { Chunk, VectorIndex } from './types';

export type RagOptions = {
  /** Lowest top score that is answered from the notes. Else RAG_MIN_SCORE, else the embedder's own. */
  minScore?: number;
  /** How many of the retrieved notes go into the prompt. */
  notesInPrompt?: number;
  models?: Models;
  index?: VectorIndex;
  chunks?: Chunk[];
  onError?: (error: unknown) => void;
};

const DEFAULT_MIN_SCORE = 0.35;
const MAX_OUTPUT_TOKENS = 400;

/** The old keyword answer, used whenever the model path cannot answer. */
export function keywordResult(question: string, model = 'keyword'): AnswerResult {
  return { ...answerFor(question), meta: { model } };
}

type Plan =
  { refuse: AnswerResult } | { request: ChatRequest; given: Chunk[]; retrieval: Retrieval };

/** Answers from retrieved notes with a model. It never throws: a failure becomes the keyword answer. */
export function createRagAnswerer(env: Env, options: RagOptions = {}): Answerer {
  const models = options.models ?? fromEnv(env);
  if (!models) throw new Error('no model is configured');
  const index = options.index ?? indexFromEnv(env);
  const chunks = new Map((options.chunks ?? buildChunks()).map((c) => [c.id, c]));
  const fromVar = env.RAG_MIN_SCORE === undefined ? NaN : Number(env.RAG_MIN_SCORE);
  const minScore =
    options.minScore ??
    (Number.isFinite(fromVar) ? fromVar : (models.embedder.suggestedMinScore ?? DEFAULT_MIN_SCORE));
  const take = options.notesInPrompt ?? 4;

  async function plan(question: string, history: Turn[]): Promise<Plan> {
    const retrieval = await retrieve(question, { embedder: models!.embedder, index, chunks });
    // no hits at all means the index was never filled: let the keyword guide answer
    if (!retrieval.hits.length) throw new Error('the notes index is empty');
    if (retrieval.topScore < minScore)
      return {
        refuse: {
          text: NOT_IN_NOTES,
          cites: [],
          meta: { model: 'none', retrievalIds: [], topScore: retrieval.topScore, costMicroUsd: 0 },
        },
      };
    const given = retrieval.hits.slice(0, take).map((h) => h.chunk);
    const request = {
      messages: buildMessages(question, given, history),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    };
    return { request, given, retrieval };
  }

  /** Checks the citations, removes the markers, and attaches what the answer cost. */
  function finish(raw: string, p: Extract<Plan, { request: ChatRequest }>, r?: ChatResult) {
    const text = stripMarkers(raw);
    const refused = !text || /not in my notes/i.test(text);
    return {
      text: text || NOT_IN_NOTES,
      cites: refused ? [] : validateCites(raw, p.given, registryIds).sourceIds,
      meta: {
        model: r?.model ?? 'unknown',
        retrievalIds: p.given.map((c) => c.id),
        topScore: p.retrieval.topScore,
        inputTokens: r?.inputTokens,
        outputTokens: r?.outputTokens,
        costMicroUsd: r?.costMicroUsd,
      },
    } satisfies AnswerResult;
  }

  return {
    async answer(question, history) {
      try {
        const p = await plan(question, history);
        if ('refuse' in p) return p.refuse;
        const r = await models.provider.chat(p.request);
        return finish(r.text, p, r);
      } catch (error) {
        options.onError?.(error);
        return keywordResult(question);
      }
    },

    async *stream(question, history) {
      let raw = '';
      let sent = false;
      let p: Plan | undefined;
      try {
        p = await plan(question, history);
        if ('refuse' in p) {
          for (const piece of wordPieces(p.refuse.text)) yield piece;
          return p.refuse;
        }
        const strip = new MarkerStripper();
        const source = models.provider.chatStream?.(p.request);
        if (!source) {
          const r = await models.provider.chat(p.request);
          for (const piece of wordPieces(stripMarkers(r.text))) yield piece;
          return finish(r.text, p, r);
        }
        for (let step = await source.next(); ; step = await source.next()) {
          if (step.done) {
            const tail = strip.flush();
            if (tail.trim()) yield tail;
            return finish(raw, p, step.value);
          }
          raw += step.value;
          const out = strip.push(step.value);
          if (out) {
            sent = true;
            yield out;
          }
        }
      } catch (error) {
        options.onError?.(error);
        // text already shown stays; a different answer cannot replace it half way
        if (sent && p && 'request' in p) return finish(raw, p);
        const fallback = keywordResult(question);
        for (const piece of wordPieces(fallback.text)) yield piece;
        return fallback;
      }
    },
  };
}
