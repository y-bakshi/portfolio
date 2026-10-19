// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pageMeta } from '../src/seo/pages';

const redirects = readFileSync(join(import.meta.dirname, '..', 'public', '_redirects'), 'utf8');

describe('the redirects for addresses that moved', () => {
  it('sends the old experience page to the experience section of the home page', () => {
    const rules = redirects
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => l.trim().split(/\s+/));
    for (const from of ['/experience/', '/experience'])
      expect(rules).toContainEqual([from, '/#experience', '301']);
  });

  it('keeps the old page out of the sitemap and the page list', () => {
    expect(pageMeta.map((p) => p.path)).not.toContain('/experience/');
  });
});
