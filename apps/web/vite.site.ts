import type { Plugin } from 'vite';
import { jsonLdScript } from './src/seo/jsonld';
import { llmsFullTxt, llmsTxt } from './src/seo/llms';
import { pageMeta } from './src/seo/pages';

/** The address the site is served from. Every absolute URL in the pages and the sitemap comes from here. */
export const SITE = 'https://yashbakshi.com';

/** The pages worth indexing, as paths. The not-found page is left out. */
export const PAGES = pageMeta.map((m) => m.path);

/**
 * The assistants and search crawlers that are welcome. They get a group of their own so the rule is
 * visible, and it repeats the private paths because a crawler with its own group ignores the `*` group.
 * Common Crawl (CCBot) is in the list on purpose: it feeds many search and answer tools, and the owner
 * wants the portfolio found. Delete a name here to turn that crawler away.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

const RULES = 'Allow: /\nDisallow: /api/\nDisallow: /admin\n';

export const robotsTxt = (site: string) =>
  `User-agent: *\n${RULES}\n` +
  `${AI_CRAWLERS.map((a) => `User-agent: ${a}\n`).join('')}${RULES}\n` +
  `Sitemap: ${site}/sitemap.xml\n`;

export const sitemapXml = (
  site: string,
  pages: string[],
  lastmod = new Date().toISOString().slice(0, 10),
) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${site}${p}</loc><lastmod>${lastmod}</lastmod></url>\n`)
    .join('')}</urlset>\n`;

/**
 * Fills `%SITE%` in every page with the site address, adds each page's structured data, and writes
 * robots.txt, sitemap.xml, llms.txt and llms-full.txt next to the pages, so the domain is written
 * down in one place.
 */
export function sitePlugin(site = SITE, pages = PAGES): Plugin {
  return {
    name: 'site',
    transformIndexHtml: (html, ctx) => {
      const filled = html.split('%SITE%').join(site);
      const ld = ctx?.path ? jsonLdScript(ctx.path, site) : '';
      return ld ? filled.replace('</head>', `    ${ld}\n  </head>`) : filled;
    },
    generateBundle() {
      const emit = (fileName: string, source: string) =>
        this.emitFile({ type: 'asset', fileName, source });
      emit('robots.txt', robotsTxt(site));
      emit('sitemap.xml', sitemapXml(site, pages));
      emit('llms.txt', llmsTxt(site));
      emit('llms-full.txt', llmsFullTxt(site));
    },
  };
}
