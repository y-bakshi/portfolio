import type { Db } from '../lib/db';
import type { Embedder } from '../llm/types';
import type { Chunk, VectorIndex } from './types';

export type IndexReport = { embedded: number; unchanged: number; removed: number };

/**
 * Brings the index and the chunks table up to date with the corpus. Only notes whose text changed
 * (or that the D1 index has no vector for) are embedded again, so a run with no edits costs nothing.
 */
export async function indexChunks(
  chunks: Chunk[],
  deps: {
    db: Db;
    embedder: Embedder;
    index: VectorIndex;
    /** True when the index keeps vectors in the chunks table itself (the D1 index). */
    vectorsInD1: boolean;
    now?: () => number;
  },
): Promise<IndexReport> {
  const now = deps.now ?? Date.now;
  const { results } = await deps.db
    .prepare('SELECT id, content_hash, embedding_json IS NOT NULL AS has_vector FROM chunks')
    .all<{ id: string; content_hash: string; has_vector: number }>();
  const known = new Map(results.map((r) => [r.id, r]));

  const stale = chunks.filter((c) => {
    const row = known.get(c.id);
    return !row || row.content_hash !== c.contentHash || (deps.vectorsInD1 && !row.has_vector);
  });
  if (stale.length) {
    const vectors = await deps.embedder.embed(stale.map((c) => `${c.title}\n${c.text}`));
    if (vectors.length !== stale.length) throw new Error('embedder returned the wrong count');
    await deps.index.upsert(stale.map((c, i) => ({ ...c, vector: vectors[i]! })));
  }

  // rows for notes the index does not keep in D1: text and hash only
  if (!deps.vectorsInD1 && stale.length) {
    await deps.db.batch(
      stale.map((c) =>
        deps.db
          .prepare(
            `INSERT INTO chunks (id, source_id, kind, title, text, content_hash, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (id) DO UPDATE SET source_id = excluded.source_id, kind = excluded.kind,
               title = excluded.title, text = excluded.text, content_hash = excluded.content_hash,
               updated_at = excluded.updated_at`,
          )
          .bind(c.id, c.sourceId, c.kind, c.title, c.text, c.contentHash, now()),
      ),
    );
  }

  const live = new Set(chunks.map((c) => c.id));
  const gone = [...known.keys()].filter((id) => !live.has(id));
  if (gone.length) {
    await deps.index.remove(gone);
    // the Vectorize and memory indexes do not touch D1 rows, so remove them here
    if (!deps.vectorsInD1)
      await deps.db.batch(
        gone.map((id) => deps.db.prepare('DELETE FROM chunks WHERE id = ?').bind(id)),
      );
  }
  return { embedded: stale.length, unchanged: chunks.length - stale.length, removed: gone.length };
}
