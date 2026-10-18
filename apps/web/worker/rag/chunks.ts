import { education, projects, roles, smallProjects } from '../../src/content';
import type { Entry, Project } from '../../src/content';
import { testpilotCase } from '../../src/content/testpilot-case';
import { facts } from './facts';
import { notes } from './notes';
import type { Chunk } from './types';

/** A small stable hash (cyrb53) for change detection. It is not a security hash. */
export function contentHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Ids of the cards on the page. A citation can only point at one of these. */
export const registryIds: ReadonlySet<string> = new Set([
  ...projects.map((p) => p.id),
  ...roles.map((r) => r.id),
  ...education.map((e) => e.id),
  'contact',
]);

function make(
  id: string,
  sourceId: string,
  kind: Chunk['kind'],
  title: string,
  text: string,
): Chunk {
  return { id, sourceId, kind, title, text, contentHash: contentHash(`${title}\n${text}`) };
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function projectChunks(p: Project): Chunk[] {
  const links = (p.links ?? []).map((l) => `${l.label}: ${l.href}`).join('. ');
  const steps = p.trace.map((t) => t.label).join(', then ');
  const build = [
    `Yash's part in ${p.name}: ${p.role}`,
    `Built with ${p.stack.join(', ')}.`,
    `The pipeline runs: ${steps}.`,
    links && `Links: ${links}.`,
  ].filter(Boolean);
  return [
    make(`project:${p.id}#detail`, p.id, 'project', p.name, `${p.name}. ${p.line} ${p.detail}`),
    make(`project:${p.id}#build`, p.id, 'project', `${p.name}: role and stack`, build.join(' ')),
  ];
}

function entryChunk(kind: 'role' | 'education', e: Entry): Chunk {
  const text = `${e.title} at ${e.org}, ${e.when}. ${e.note}`;
  return make(`${kind}:${e.id}`, e.id, kind, `${e.title}, ${e.org}`, text);
}

function caseChunks(): Chunk[] {
  const c = testpilotCase;
  const results = c.results.map((r) => `${r.lead} ${r.text}`).join(' ');
  const part = (id: string, title: string, text: string) =>
    make(`case:testpilot#${id}`, 'testpilot', 'case-study', `TestPilot case study: ${title}`, text);
  return [
    part('problem', 'the problem', c.problem.join(' ')),
    part('build', 'what Yash built', c.built.join(' ')),
    part('results', 'results', results),
    part(
      'facts',
      'team, source and demo',
      `Team: ${c.team} Source: ${c.source} The live demo is at ${c.demo.href}${c.demo.after}`,
    ),
  ];
}

/** Every note the guide can answer from, built from the same content the pages show. Deterministic. */
export function buildChunks(): Chunk[] {
  return [
    ...projects.flatMap(projectChunks),
    ...caseChunks(),
    ...roles.map((r) => entryChunk('role', r)),
    ...education.map((e) => entryChunk('education', e)),
    ...smallProjects.map((s) =>
      make(
        `small:${slug(s.name)}`,
        'small-projects',
        'small-project',
        s.name,
        `${s.name}. ${s.line}`,
      ),
    ),
    ...[...facts, ...notes].map((f) => make(f.id, f.sourceId, 'fact', f.title, f.text)),
  ];
}
