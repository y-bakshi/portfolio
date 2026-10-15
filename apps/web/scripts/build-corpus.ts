import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildChunks } from '../worker/rag/chunks';

export const CORPUS_PATH = join(
  import.meta.dirname,
  '..',
  'worker',
  'rag',
  'corpus.generated.json',
);

/** The corpus as committed: the same JSON on every run, so a diff shows exactly what changed. */
export function corpusJson(): string {
  return JSON.stringify(buildChunks(), null, 2) + '\n';
}

/** Writes worker/rag/corpus.generated.json from the content modules the pages use. */
export function main() {
  writeFileSync(CORPUS_PATH, corpusJson());
  console.log(`Wrote ${buildChunks().length} notes to worker/rag/corpus.generated.json`);
}
