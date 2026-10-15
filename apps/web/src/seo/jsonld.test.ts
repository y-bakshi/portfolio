import { SITE } from '../../vite.site';
import { education } from '../content';
import { profileLinks } from './contact';
import { jsonLdFor, jsonLdScript } from './jsonld';
import { pageMeta } from './pages';

type Node = Record<string, any>;

const graph = (path: string) => (jsonLdFor(path, SITE) as { '@graph': Node[] })['@graph'];
const ofType = (path: string, type: string) => graph(path).find((n) => n['@type'] === type)!;

/** Every value in a JSON tree, with its key, so a test can look at all of them. */
function walk(value: unknown, key = ''): [string, unknown][] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => [[k, v] as [string, unknown], ...walk(v, k)]);
  }
  return [[key, value]];
}

describe('structured data', () => {
  it('is valid JSON inside a script tag, for every indexed page', () => {
    for (const m of pageMeta) {
      const tag = jsonLdScript(m.path, SITE);
      const body = /^<script type="application\/ld\+json">(.*)<\/script>$/s.exec(tag)?.[1];
      expect(body, m.path).toBeTruthy();
      const data = JSON.parse(body!);
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@graph'].length).toBeGreaterThan(0);
    }
  });

  it('has nothing for the not-found page', () => {
    expect(jsonLdScript('/404.html', SITE)).toBe('');
  });

  it('describes the person on the home page', () => {
    const p = ofType('/', 'Person');
    expect(p.name).toBe('Yash Bakshi');
    expect(p.url).toBe(`${SITE}/`);
    expect(p.jobTitle).toBe('Software engineer');
    expect(p.sameAs).toEqual(profileLinks);
    expect(p.sameAs).toEqual(
      expect.arrayContaining(['https://github.com/y-bakshi', expect.stringContaining('linkedin')]),
    );
    expect(p.alumniOf.map((a: Node) => a.name)).toEqual(education.map((e) => e.org));
    expect(p.knowsAbout).toEqual(expect.arrayContaining(['FastAPI', 'Bedrock', 'React']));
    expect(ofType('/', 'WebSite').url).toBe(`${SITE}/`);
  });

  it('gives inner pages a breadcrumb trail that starts at home', () => {
    const trail: Node[] = ofType('/projects/testpilot/', 'BreadcrumbList').itemListElement;
    expect(trail.map((t) => t.position)).toEqual([1, 2, 3]);
    expect(trail.map((t) => t.item)).toEqual([
      `${SITE}/`,
      `${SITE}/projects/`,
      `${SITE}/projects/testpilot/`,
    ]);
    expect(ofType('/projects/', 'BreadcrumbList').itemListElement).toHaveLength(2);
    expect(graph('/').some((n) => n['@type'] === 'BreadcrumbList')).toBe(false);
  });

  it('describes the case study as a technical article by the person', () => {
    const a = ofType('/projects/testpilot/', 'TechArticle');
    expect(a.headline).toBe('TestPilot case study');
    expect(a.url).toBe(`${SITE}/projects/testpilot/`);
    expect(a.author.name).toBe('Yash Bakshi');
    expect(a.description).toBeTruthy();
  });

  it('has only absolute addresses, on the site or at a known profile, and no empty value', () => {
    for (const m of pageMeta) {
      for (const [key, v] of walk(jsonLdFor(m.path, SITE))) {
        const where = `${m.path} ${key}`;
        expect(v, where).not.toBeNull();
        expect(v, where).not.toBeUndefined();
        if (Array.isArray(v)) expect(v.length, where).toBeGreaterThan(0);
        if (typeof v !== 'string' || key === '@context') continue;
        expect(v.trim(), where).not.toBe('');
        if (/^https?:/.test(v)) {
          expect(v.startsWith(SITE) || profileLinks.includes(v), `${where}: ${v}`).toBe(true);
        }
      }
    }
  });

  it('escapes a less-than sign so no value can close the script tag', () => {
    const tag = jsonLdScript('/', SITE);
    expect(
      tag.slice('<script type="application/ld+json">'.length, -'</script>'.length),
    ).not.toContain('<');
  });
});
