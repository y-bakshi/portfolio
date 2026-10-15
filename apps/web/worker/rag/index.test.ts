// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../env';
import { mockEmbedder } from '../llm/mock';
import { testDb } from '../test/sqlite-d1';
import { buildChunks } from './chunks';
import { exportSql, exportVectorizeNdjson } from './export';
import { indexChunks } from './indexer';
import { createD1Index, createMemoryIndex, createVectorizeIndex, indexFromEnv } from './indexes';
import type { Chunk } from './types';

const chunks = buildChunks();

describe('the chunks table', () => {
  it('is created by the migrations with the columns the index needs', async () => {
    const db = testDb();
    const { results } = await db.prepare('PRAGMA table_info(chunks)').all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual([
      'id',
      'source_id',
      'kind',
      'title',
      'text',
      'content_hash',
      'embedding_json',
      'updated_at',
    ]);
  });
});

describe('the D1 index', () => {
  it('finds the closest note by cosine similarity and forgets removed ones', async () => {
    const db = testDb();
    const index = createD1Index(db);
    const vectors = await mockEmbedder.embed(chunks.map((c) => `${c.title}\n${c.text}`));
    await index.upsert(chunks.map((c, i) => ({ ...c, vector: vectors[i]! })));
    const [q] = await mockEmbedder.embed(['Rust process monitor with WebSockets']);
    const hits = await index.query(q!, 3);
    expect(hits[0]!.id).toContain('procwatch');
    expect(hits[0]!.score).toBeGreaterThan(hits[2]!.score);
    await index.remove([hits[0]!.id]);
    expect((await index.query(q!, 1))[0]!.id).not.toBe(hits[0]!.id);
  });
});

describe('the memory index', () => {
  it('orders by score and breaks ties by id', async () => {
    const index = createMemoryIndex();
    const base = { sourceId: 's', kind: 'fact', title: 't', text: 't', contentHash: 'h' } as const;
    await index.upsert([
      { ...base, id: 'b', vector: [1, 0] },
      { ...base, id: 'a', vector: [1, 0] },
      { ...base, id: 'c', vector: [0, 1] },
    ]);
    expect((await index.query([1, 0], 3)).map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('the Vectorize index', () => {
  it('passes vectors with metadata and maps matches to hits', async () => {
    const binding = {
      upsert: vi.fn(async () => ({})),
      query: vi.fn(async () => ({ matches: [{ id: 'x', score: 0.9 }], count: 1 })),
      deleteByIds: vi.fn(async () => ({})),
    };
    const index = createVectorizeIndex(binding as never);
    await index.upsert([{ ...chunks[0]!, vector: [1, 2] }]);
    expect(binding.upsert).toHaveBeenCalledWith([
      {
        id: chunks[0]!.id,
        values: [1, 2],
        metadata: { sourceId: chunks[0]!.sourceId, kind: chunks[0]!.kind },
      },
    ]);
    expect(await index.query([1, 2], 5)).toEqual([{ id: 'x', score: 0.9 }]);
    expect(binding.query).toHaveBeenCalledWith([1, 2], { topK: 5 });
  });

  it('is chosen when the binding exists, otherwise D1 is', () => {
    expect(indexFromEnv({ VECTORIZE: {} } as unknown as Env).kind).toBe('vectorize');
    expect(indexFromEnv({ DB: testDb() } as unknown as Env).kind).toBe('d1');
  });
});

describe('the indexer', () => {
  const edit = (c: Chunk): Chunk => ({ ...c, text: c.text + ' More.', contentHash: 'changed' });

  it('embeds only what changed and removes what is gone (D1 index)', async () => {
    const db = testDb();
    const index = createD1Index(db);
    const embed = vi.fn(mockEmbedder.embed);
    const deps = { db, embedder: { ...mockEmbedder, embed }, index, vectorsInD1: true };

    expect(await indexChunks(chunks, deps)).toEqual({
      embedded: chunks.length,
      unchanged: 0,
      removed: 0,
    });
    expect(await indexChunks(chunks, deps)).toEqual({
      embedded: 0,
      unchanged: chunks.length,
      removed: 0,
    });

    const next = [edit(chunks[0]!), ...chunks.slice(2)];
    expect(await indexChunks(next, deps)).toEqual({
      embedded: 1,
      unchanged: next.length - 1,
      removed: 1,
    });
    const count = await db.prepare('SELECT COUNT(*) AS n FROM chunks').first<{ n: number }>();
    expect(count?.n).toBe(next.length);
  });

  it('writes rows without vectors when the index is elsewhere', async () => {
    const db = testDb();
    const deps = { db, embedder: mockEmbedder, index: createMemoryIndex(), vectorsInD1: false };
    await indexChunks(chunks, deps);
    const row = await db
      .prepare('SELECT embedding_json, content_hash FROM chunks WHERE id = ?')
      .bind(chunks[0]!.id)
      .first<{ embedding_json: string | null; content_hash: string }>();
    expect(row).toEqual({ embedding_json: null, content_hash: chunks[0]!.contentHash });
    expect((await indexChunks(chunks, deps)).embedded).toBe(0);
  });
});

describe('export files', () => {
  it('writes SQL that a database accepts, quoting apostrophes', async () => {
    const db = testDb();
    const tricky = [{ ...chunks[0]!, text: "Yash's notes" }];
    db.exec(exportSql(tricky, [[0.5, 0.5]], 1));
    const row = await db
      .prepare('SELECT text, embedding_json FROM chunks')
      .first<{ text: string; embedding_json: string }>();
    expect(row).toEqual({ text: "Yash's notes", embedding_json: '[0.5,0.5]' });
  });

  it('writes one JSON object per line for Vectorize', () => {
    const lines = exportVectorizeNdjson(chunks.slice(0, 2), [[1], [2]])
      .trim()
      .split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]!)).toMatchObject({ id: chunks[1]!.id, values: [2] });
  });
});
