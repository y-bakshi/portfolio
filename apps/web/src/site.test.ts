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
