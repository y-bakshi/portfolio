// Embeds the corpus and writes files you apply to a real database or index. Nothing here talks to
// your Cloudflare database; it only asks Workers AI for embeddings (or uses the fake ones).
//
//   npm run corpus:index -- --mock                 fake embeddings, for a local database
//   GEMINI_API_KEY=... npm run corpus:index                      real Gemini embeddings (as LLM_PROVIDER=gemini uses)
//   CF_ACCOUNT_ID=... CF_API_TOKEN=... npm run corpus:index     real bge embeddings (LLM_PROVIDER=workers-ai)
//
// It writes worker/rag/chunks.generated.sql (apply with `wrangler d1 execute DB --file=...`, add
// `--local` for the local database) and worker/rag/vectors.generated.ndjson (for Vectorize, with
// `wrangler vectorize insert guide-chunks --file=...`). Both are ignored by git.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createGeminiEmbedder } from '../worker/llm/gemini-embed';
import { mockEmbedder } from '../worker/llm/mock';
import type { Embedder } from '../worker/llm/types';
import { createWorkersAiEmbedder, restAi } from '../worker/llm/workersai';
import { buildChunks } from '../worker/rag/chunks';
import { exportSql, exportVectorizeNdjson } from '../worker/rag/export';

export async function main(args: string[]) {
  const { CF_ACCOUNT_ID: account, CF_API_TOKEN: token, GEMINI_API_KEY: gemini } = process.env;
  let embedder: Embedder;
  if (args.includes('--mock')) embedder = mockEmbedder;
  else if (gemini) embedder = createGeminiEmbedder({ apiKey: gemini });
  else if (account && token) embedder = createWorkersAiEmbedder(restAi(account, token));
  else
    throw new Error(
      'Set GEMINI_API_KEY (or CF_ACCOUNT_ID and CF_API_TOKEN), or pass --mock for fake embeddings.',
    );

  const chunks = buildChunks();
  const vectors = await embedder.embed(chunks.map((c) => `${c.title}\n${c.text}`));
  const dir = join(import.meta.dirname, '..', 'worker', 'rag');
  writeFileSync(join(dir, 'chunks.generated.sql'), exportSql(chunks, vectors, Date.now()));
  writeFileSync(join(dir, 'vectors.generated.ndjson'), exportVectorizeNdjson(chunks, vectors));
  console.log(`Embedded ${chunks.length} notes (${embedder.dimensions} dimensions).`);
}
