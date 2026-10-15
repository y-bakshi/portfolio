import wrangler from '../wrangler.jsonc?raw';
import { AI_CRAWLERS, PAGES, SITE, robotsTxt, sitePlugin, sitemapXml } from '../vite.site';
import indexHtml from '../index.html?raw';
import projectsHtml from '../projects/index.html?raw';
import caseHtml from '../projects/testpilot/index.html?raw';
import notFoundHtml from '../404.html?raw';
import { pageMeta } from './seo/pages';

describe('site files', () => {
  it('points robots.txt at the sitemap on the site address', () => {
    expect(robotsTxt(SITE)).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robotsTxt(SITE)).toContain('Allow: /');
  });

  it('keeps the API and the owner page out of search, for everyone', () => {
    const groups = robotsTxt(SITE).split('\n\n');
    expect(groups.length).toBeGreaterThan(2);
    for (const g of groups.filter((g) => g.startsWith('User-agent'))) {
      expect(g).toContain('Disallow: /api/');
      expect(g).toContain('Disallow: /admin');
      expect(g).toContain('Allow: /');
    }
  });

  it('names each AI crawler it welcomes', () => {
    for (const bot of ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User'])
      expect(AI_CRAWLERS).toContain(bot);
    for (const bot of AI_CRAWLERS)
      expect(robotsTxt(SITE)).toContain(`User-agent: ${bot}
`);
  });

  it('lists every page once, with the full address, and not the not-found page', () => {
    const xml = sitemapXml(SITE, PAGES);
    for (const p of PAGES) expect(xml).toContain(`<loc>${SITE}${p}</loc>`);
    expect(xml.match(/<loc>/g)).toHaveLength(PAGES.length);
    expect(xml.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g)).toHaveLength(PAGES.length);
    expect(sitemapXml(SITE, ['/'], '2026-01-02')).toContain('<lastmod>2026-01-02</lastmod>');
    expect(xml).not.toContain('404');
  });

  it('fills the site address into a page', () => {
    const plugin = sitePlugin('https://example.test');
    const transform = plugin.transformIndexHtml as (html: string) => string;
    expect(transform('<a href="%SITE%/x"></a><b>%SITE%</b>')).toBe(
      '<a href="https://example.test/x"></a><b>https://example.test</b>',
    );
  });
});

describe('page heads', () => {
  const heads: [string, string][] = [
    ['/', indexHtml],
    ['/projects/', projectsHtml],
    ['/projects/testpilot/', caseHtml],
  ];
  const tag = (html: string, re: RegExp) => re.exec(html)?.[1];

  it('carry the title and description the structured data uses', () => {
    for (const [path, html] of heads) {
      const meta = pageMeta.find((m) => m.path === path)!;
      expect(tag(html, /<title>(.*?)<\/title>/), path).toBe(meta.title);
      expect(tag(html, /name="description"\s+content="(.*?)"/s), path).toBe(meta.description);
      expect(html, path).toContain(`<link rel="canonical" href="%SITE%${path}" />`);
    }
  });

  it('carry the social and search tags', () => {
    for (const [path, html] of heads) {
      for (const needle of [
        'property="og:site_name"',
        'property="og:locale"',
        'property="og:image:width"',
        'property="og:image:height"',
        'property="og:image:alt"',
        'name="twitter:title"',
        'name="twitter:description"',
        'name="twitter:image"',
        'name="author"',
        'max-image-preview:large',
      ])
        expect(html, `${path} ${needle}`).toContain(needle);
      expect(html, path).not.toContain('noindex');
    }
  });

  it('points the home page at llms.txt', () => {
    expect(indexHtml).toContain('rel="alternate" type="text/plain" href="/llms.txt"');
  });

  it('keeps the not-found page out of search', () => {
    expect(notFoundHtml).toContain('content="noindex"');
  });
});

describe('wrangler.jsonc', () => {
  // each deploy applies this file, so a toggle flipped in the dashboard would be undone by the next one
  const active = wrangler.replace(/^\s*\/\/.*$/gm, '');

  it('turns off the workers.dev address and the public preview addresses', () => {
    expect(active).toMatch(/"workers_dev":\s*false/);
    expect(active).toMatch(/"preview_urls":\s*false/);
  });

  it('serves the build folder with the not-found page', () => {
    expect(active).toMatch(/"directory":\s*"\.\/dist"/);
    expect(active).toMatch(/"not_found_handling":\s*"404-page"/);
  });
});
