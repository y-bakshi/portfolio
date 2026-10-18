import type { Vectorize } from '@cloudflare/workers-types';
import type { Env } from '../env';
import type { Db } from '../lib/db';
import type { Hit, VectorIndex } from './types';

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function top(scored: Hit[], k: number): Hit[] {
  return scored.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id)).slice(0, k);
}

/** Vectors in memory. For tests. */
export function createMemoryIndex(): VectorIndex {
  const vectors = new Map<string, number[]>();
  return {
    async upsert(records) {
      for (const r of records) vectors.set(r.id, r.vector);
    },
    async query(vector, k) {
      return top(
        [...vectors].map(([id, v]) => ({ id, score: cosine(vector, v) })),
        k,
      );
    },
    async remove(ids) {
      for (const id of ids) vectors.delete(id);
    },
  };
}

const CACHE_MS = 60_000;
const cache = new WeakMap<object, { at: number; rows: { id: string; vector: number[] }[] }>();

/**
 * Vectors stored as JSON in the chunks table, compared one by one. It is the index for local use
 * and a fine production fallback for a corpus this small (a few dozen notes).
 */
export function createD1Index(db: Db, now: () => number = Date.now): VectorIndex {
  async function load() {
    const hit = cache.get(db);
    if (hit && now() - hit.at < CACHE_MS) return hit.rows;
    const { results } = await db
      .prepare('SELECT id, embedding_json FROM chunks WHERE embedding_json IS NOT NULL')
      .all<{ id: string; embedding_json: string }>();
    const rows = results.map((r) => ({
      id: r.id,
      vector: JSON.parse(r.embedding_json) as number[],
    }));
    cache.set(db, { at: now(), rows });
    return rows;
  }
  return {
    async upsert(records) {
      // the whole row is written, so a note indexed here needs nothing else
      await db.batch(
        records.map((r) =>
          db
            .prepare(
              `INSERT INTO chunks (id, source_id, kind, title, text, content_hash, embedding_json, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (id) DO UPDATE SET source_id = excluded.source_id, kind = excluded.kind,
                 title = excluded.title, text = excluded.text, content_hash = excluded.content_hash,
                 embedding_json = excluded.embedding_json, updated_at = excluded.updated_at`,
            )
            .bind(
              r.id,
              r.sourceId,
              r.kind,
              r.title,
              r.text,
              r.contentHash,
              JSON.stringify(r.vector),
              now(),
            ),
        ),
      );
      cache.delete(db);
    },
    async query(vector, k) {
      const rows = await load();
      return top(
        rows.map((r) => ({ id: r.id, score: cosine(vector, r.vector) })),
        k,
      );
    },
    async remove(ids) {
      await db.batch(ids.map((id) => db.prepare('DELETE FROM chunks WHERE id = ?').bind(id)));
      cache.delete(db);
    },
  };
}

/** Cloudflare Vectorize. The index must be created with the embedder's dimensions and the cosine metric. */
export function createVectorizeIndex(binding: Vectorize): VectorIndex {
  return {
    async upsert(records) {
      await binding.upsert(
        records.map((r) => ({
          id: r.id,
          values: r.vector,
          metadata: { sourceId: r.sourceId, kind: r.kind },
        })),
      );
    },
    async query(vector, k) {
      const out = await binding.query(vector, { topK: k });
      return out.matches.map((m) => ({ id: m.id, score: m.score }));
    },
    async remove(ids) {
      if (ids.length) await binding.deleteByIds(ids);
    },
  };
}

/** Vectorize when the binding exists, otherwise the notes are searched in D1. */
export function indexFromEnv(env: Env): VectorIndex & { kind: 'vectorize' | 'd1' } {
  if (env.VECTORIZE) return { ...createVectorizeIndex(env.VECTORIZE), kind: 'vectorize' };
  return { ...createD1Index(env.DB as unknown as Db), kind: 'd1' };
}
