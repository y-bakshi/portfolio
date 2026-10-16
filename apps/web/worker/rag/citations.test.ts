// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MarkerStripper, markedIds, stripMarkers, validateCites } from './citations';
import type { Chunk } from './types';

const chunk = (id: string, sourceId: string): Chunk => ({
  id,
  sourceId,
  kind: 'project',
  title: id,
  text: id,
  contentHash: id,
});

describe('stripMarkers', () => {
  it('removes markers and the space before them', () => {
    expect(
      stripMarkers('It uses pgvector [project:testpilot#detail]. Next [role:thryv, fact:contact].'),
    ).toBe('It uses pgvector. Next.');
  });

  it('keeps ordinary brackets', () => {
    expect(stripMarkers('See [1] and [the docs].')).toBe('See [1] and [the docs].');
  });

  it('catches a marker split across pieces and flushes an unfinished bracket', () => {
    const s = new MarkerStripper();
    const out = ['Built it ', '[project:test', 'pilot#detail] now ', '[open'].map((p) => s.push(p));
    expect(out.join('') + s.flush()).toBe('Built it now [open');
  });
});

describe('validateCites', () => {
  const given = [
    chunk('project:testpilot#detail', 'testpilot'),
    chunk('project:testpilot#build', 'testpilot'),
    chunk('fact:skills', 'general'),
  ];
  const registry = new Set(['testpilot', 'thryv']);

  it('lists marked ids in order', () => {
    expect(markedIds('a [x:one] b [y:two, z:three]')).toEqual(['x:one', 'y:two', 'z:three']);
  });

  it('drops ids that were not given and maps the rest to unique page cards', () => {
    const text = '[project:testpilot#detail] [project:testpilot#build] [role:thryv] [fact:skills]';
    expect(validateCites(text, given, registry)).toEqual({
      chunkIds: ['project:testpilot#detail', 'project:testpilot#build', 'fact:skills'],
      sourceIds: ['testpilot'],
    });
  });

  it('gives nothing for text with no markers', () => {
    expect(validateCites('No cites here.', given, registry).sourceIds).toEqual([]);
  });
});
