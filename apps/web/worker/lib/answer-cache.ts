import { splitPage } from '../rag/page';
import { wordPieces, type AnswerResult, type Answerer, type Turn } from './answerer';
import type { Db } from './db';

/** A saved answer is used for this long. */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Lower case, no punctuation, single spaces: "What has Yash built with RAG?" and "what has yash built with rag" match. */
export const normalise = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type Options = {
  db: Db;
  clock: () => number;
  /** Names the notes, rules and model, so an old answer is never reused after a change. */
  version: string;
  /** The questions worth saving: the ones the suggestion buttons ask. */
  questions: readonly string[];
};

/** Only a real answer is saved: not a failure, and not "that is not in my notes". */
const worthSaving = (r: AnswerResult) =>
  r.meta?.model !== undefined &&
  !['unavailable', 'none', 'cache'].includes(r.meta.model) &&
  !/not in my notes/i.test(r.text);

/**
 * Wraps an answerer so the questions the suggestion buttons ask are answered by the model once and
 * then read back from the database. Those questions do not depend on the page or the chat so far, so
 * they are asked of the model without either, which is also what makes the saved answer fair to reuse.
 * Every other question goes straight through. A hit costs nothing and the meta says `cache`.
 */
export function cachedAnswerer(inner: Answerer, options: Options): Answerer {
  const known = new Set(options.questions.map(normalise));
  const keyOf = (bare: string) => `${options.version}:${normalise(bare)}`;

  async function lookup(key: string): Promise<AnswerResult | null> {
    try {
      const row = await options.db
        .prepare('SELECT text, cites_json, created_at FROM answer_cache WHERE key = ?')
        .bind(key)
        .first<{ text: string; cites_json: string; created_at: number }>();
      if (!row || options.clock() - row.created_at > CACHE_TTL_MS) return null;
      const cites = JSON.parse(row.cites_json) as unknown;
      return {
        text: row.text,
        cites: Array.isArray(cites) ? cites.filter((c): c is string => typeof c === 'string') : [],
        meta: { model: 'cache', costMicroUsd: 0, retrievalIds: [] },
      };
    } catch {
      return null; // a broken cache must never stop an answer
    }
  }

  async function save(key: string, r: AnswerResult) {
    if (!worthSaving(r)) return;
    const now = options.clock();
    try {
      await options.db.batch([
        options.db
          .prepare('DELETE FROM answer_cache WHERE created_at < ?')
          .bind(now - CACHE_TTL_MS),
        options.db
          .prepare(
            'INSERT OR REPLACE INTO answer_cache (key, text, cites_json, created_at) VALUES (?, ?, ?, ?)',
          )
          .bind(key, r.text, JSON.stringify(r.cites), now),
      ]);
    } catch {
      // not saved this time; the next ask tries again
    }
  }

  /** The bare question when it is one worth saving, otherwise null. */
  const cacheable = (given: string) => {
    const { question } = splitPage(given);
    return known.has(normalise(question)) ? question : null;
  };

  return {
    async answer(given, history) {
      const bare = cacheable(given);
      if (bare === null) return inner.answer(given, history);
      const key = keyOf(bare);
      const hit = await lookup(key);
      if (hit) return hit;
      const result = await inner.answer(bare, []);
      await save(key, result);
      return result;
    },

    async *stream(given, history) {
      const bare = cacheable(given);
      if (bare === null) {
        if (inner.stream) return yield* inner.stream(given, history);
        const result = await inner.answer(given, history);
        for (const piece of wordPieces(result.text)) yield piece;
        return result;
      }
      const key = keyOf(bare);
      const hit = await lookup(key);
      if (hit) {
        for (const piece of wordPieces(hit.text)) yield piece;
        return hit;
      }
      let result: AnswerResult;
      if (inner.stream) {
        const it = inner.stream(bare, [] as Turn[]);
        for (;;) {
          const step = await it.next();
          if (step.done) {
            result = step.value;
            break;
          }
          yield step.value;
        }
      } else {
        result = await inner.answer(bare, []);
        for (const piece of wordPieces(result.text)) yield piece;
      }
      await save(key, result);
      return result;
    },
  };
}
