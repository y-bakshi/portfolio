// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { corpusJson, CORPUS_PATH } from '../../scripts/build-corpus';
import { projects } from '../../src/content';
import { buildChunks, contentHash, registryIds } from './chunks';
import { CONTACT_LINKS } from './facts';

describe('the corpus', () => {
  it('is the same every time it is built', () => {
    expect(buildChunks()).toEqual(buildChunks());
  });

  it('has unique ids of the form kind:name and short notes', () => {
    const chunks = buildChunks();
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    for (const c of chunks) {
      expect(c.id, c.id).toMatch(/^[a-z-]+:[a-z0-9-]+(#[a-z]+)?$/);
      expect(c.text.split(/\s+/).length, c.id).toBeLessThanOrEqual(200);
      expect(c.contentHash).toBe(contentHash(`${c.title}\n${c.text}`));
    }
  });

  it('covers every project, with a detail note that cites its card', () => {
    const chunks = buildChunks();
    for (const p of projects) {
      const detail = chunks.find((c) => c.id === `project:${p.id}#detail`);
      expect(detail?.sourceId).toBe(p.id);
      expect(detail?.text).toContain(p.detail);
    }
  });

  it('points every note at a card on the page, or at a group that has no card', () => {
    for (const c of buildChunks()) {
      if (!registryIds.has(c.sourceId)) expect(['general', 'small-projects']).toContain(c.sourceId);
    }
  });

  it('matches the committed corpus.generated.json', () => {
    // Windows checkouts may turn line endings into CRLF
    const committed = readFileSync(CORPUS_PATH, 'utf8').replace(/\r\n/g, '\n');
    expect(
      corpusJson(),
      'The site content changed but the corpus was not rebuilt. Run `npm run corpus:build` in apps/web and commit worker/rag/corpus.generated.json.',
    ).toBe(committed);
  });
});

describe('the contact facts', () => {
  it('use only links that the contact section of the page shows', () => {
    const page = readFileSync(join(import.meta.dirname, '../../src/sections/Contact.tsx'), 'utf8');
    for (const value of Object.values(CONTACT_LINKS)) expect(page, value).toContain(value);
  });
});
