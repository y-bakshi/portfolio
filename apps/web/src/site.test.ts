import wrangler from '../wrangler.jsonc?raw';
import { PAGES, SITE, robotsTxt, sitePlugin, sitemapXml } from '../vite.site';

describe('site files', () => {
  it('points robots.txt at the sitemap on the site address', () => {
    expect(robotsTxt(SITE)).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robotsTxt(SITE)).toContain('Allow: /');
  });

  it('lists every page once, with the full address, and not the not-found page', () => {
    const xml = sitemapXml(SITE, PAGES);
    for (const p of PAGES) expect(xml).toContain(`<loc>${SITE}${p}</loc>`);
    expect(xml.match(/<loc>/g)).toHaveLength(PAGES.length);
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
