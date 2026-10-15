import type { Chunk } from './types';

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;

/**
 * SQL that puts every note and its vector into the chunks table. Apply it with
 * `wrangler d1 execute DB --file=...`. Notes no longer in the corpus are deleted.
 */
export function exportSql(chunks: Chunk[], vectors: number[][], now: number): string {
  const rows = chunks.map((c, i) => {
    const values = [c.id, c.sourceId, c.kind, c.title, c.text, c.contentHash].map(quote);
    values.push(quote(JSON.stringify(vectors[i])), String(now));
    return `INSERT INTO chunks (id, source_id, kind, title, text, content_hash, embedding_json, updated_at) VALUES (${values.join(', ')}) ON CONFLICT (id) DO UPDATE SET source_id = excluded.source_id, kind = excluded.kind, title = excluded.title, text = excluded.text, content_hash = excluded.content_hash, embedding_json = excluded.embedding_json, updated_at = excluded.updated_at;`;
  });
  const keep = chunks.map((c) => quote(c.id)).join(', ');
  return [...rows, `DELETE FROM chunks WHERE id NOT IN (${keep});`, ''].join('\n');
}

/** One JSON object per line, the format `wrangler vectorize insert` reads. */
export function exportVectorizeNdjson(chunks: Chunk[], vectors: number[][]): string {
  return (
    chunks
      .map((c, i) =>
        JSON.stringify({
          id: c.id,
          values: vectors[i],
          metadata: { sourceId: c.sourceId, kind: c.kind },
        }),
      )
      .join('\n') + '\n'
  );
}
