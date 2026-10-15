import { unavailableAnswer } from '../../src/content/answers';
import type { Env } from '../env';
import { wordPieces, type AnswerResult, type Answerer, type Turn } from '../lib/answerer';
import { fromEnv, type Models } from '../llm';
import type { ChatRequest, ChatResult } from '../llm/types';
import { buildChunks, registryIds } from './chunks';
import { MarkerStripper, stripMarkers, validateCites } from './citations';
import { indexFromEnv } from './indexes';
import {
  contactFloor,
  looksLikeInjection,
  NEAR_MISS,
  NOT_IN_NOTES,
  NOT_IN_NOTES_RE,
  withPointer,
} from './gap';
import { buildMessages } from './prompt';
import { retrieve, type Retrieval } from './retrieve';
import type { Chunk, VectorIndex } from './types';

export type RagOptions = {
  /** Lowest top score that is answered from the notes. Else RAG_MIN_SCORE, else the embedder's own. */
  minScore?: number;
  /** How many of the retrieved notes go into the prompt. */
  notesInPrompt?: number;
  /** Lowest top score that still gets the pointer to Yash. Else RAG_CONTACT_MIN_SCORE, else 60% of minScore. */
  contactMinScore?: number;
  models?: Models;
  index?: VectorIndex;
  chunks?: Chunk[];
  onError?: (error: unknown) => void;
};

const DEFAULT_MIN_SCORE = 0.35;
const MAX_OUTPUT_TOKENS = 400;

/** The old keyword answer, used whenever the model path cannot answer. */
export function unavailableResult(): AnswerResult {
  return { ...unavailableAnswer, meta: { model: 'unavailable' } };
}

type Asked = { request: ChatRequest; given: Chunk[]; retrieval: Retrieval; question: string };
type Plan = { refuse: AnswerResult } | Asked;

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
  const contactVar =
    env.RAG_CONTACT_MIN_SCORE === undefined ? NaN : Number(env.RAG_CONTACT_MIN_SCORE);
  const floor = contactFloor(
    minScore,
    options.contactMinScore ?? (Number.isFinite(contactVar) ? contactVar : undefined),
  );

  async function plan(question: string, history: Turn[]): Promise<Plan> {
    const retrieval = await retrieve(question, { embedder: models!.embedder, index, chunks });
    // no hits at all means the index was never filled: let the keyword guide answer
    if (!retrieval.hits.length) throw new Error('the notes index is empty');
    const { topScore } = retrieval;
    const meta = { model: 'none', topScore, costMicroUsd: 0 };
    // far from every note: nothing to point to, and Yash is not the one to ask
    if (topScore < floor || looksLikeInjection(question))
      return { refuse: { text: NOT_IN_NOTES, cites: [], meta: { ...meta, retrievalIds: [] } } };
    const near = retrieval.hits.slice(0, take).map((h) => h.chunk);
    // close to the notes but not enough to answer: refuse, point to Yash, show the nearest cards
    if (topScore < minScore) {
      const g = withPointer(NEAR_MISS, question, [], near, registryIds);
      return {
        refuse: { text: g.text, cites: g.cites, meta: { ...meta, retrievalIds: g.retrieved } },
      };
    }
    const request = {
      messages: buildMessages(question, near, history),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    };
    return { request, given: near, retrieval, question };
  }

  /** Checks the citations, removes the markers, adds the way forward, and attaches the cost. */
  function finish(raw: string, p: Asked, r?: ChatResult) {
    let text = stripMarkers(raw) || 'That is not in my notes.';
    let cites = validateCites(raw, p.given, registryIds).sourceIds;
    if (NOT_IN_NOTES_RE.test(text)) {
      const g = withPointer(text, p.question, cites, p.given, registryIds);
      ({ text, cites } = g);
    }
    return {
      text,
      cites,
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

  /** What finish() added after the text the visitor already saw, so the stream ends equal to the stored text. */
  const tail = (shown: string, done: AnswerResult) =>
    done.text.startsWith(shown) ? done.text.slice(shown.length) : '';

  return {
    async answer(question, history) {
      try {
        const p = await plan(question, history);
        if ('refuse' in p) return p.refuse;
        const r = await models.provider.chat(p.request);
        return finish(r.text, p, r);
      } catch (error) {
        options.onError?.(error);
        return unavailableResult();
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
          const done = finish(r.text, p, r);
          for (const piece of wordPieces(done.text)) yield piece;
          return done;
        }
        for (let step = await source.next(); ; step = await source.next()) {
          if (step.done) {
            const rest = strip.flush();
            if (rest.trim()) yield rest;
            const done = finish(raw, p, step.value);
            const extra = tail(stripMarkers(raw), done);
            if (extra) yield extra;
            return done;
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
        const fallback = unavailableResult();
        for (const piece of wordPieces(fallback.text)) yield piece;
        return fallback;
      }
    },
  };
}
