import type { Plugin } from 'vite';

/** The address the site is served from. Every absolute URL in the pages and the sitemap comes from here. */
export const SITE = 'https://yashbakshi.com';

/** The pages worth indexing, as paths. The not-found page is left out. */
export const PAGES = ['/', '/projects/', '/projects/testpilot/'];

export const robotsTxt = (site: string) =>
  `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`;

export const sitemapXml = (site: string, pages: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${site}${p}</loc></url>\n`)
    .join('')}</urlset>\n`;

/**
 * Fills `%SITE%` in every page with the site address, and writes robots.txt and sitemap.xml next to
 * the pages, so the domain is written down in one place.
 */
export function sitePlugin(site = SITE, pages = PAGES): Plugin {
  return {
    name: 'site',
    transformIndexHtml: (html) => html.split('%SITE%').join(site),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(site) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(site, pages) });
    },
  };
}
