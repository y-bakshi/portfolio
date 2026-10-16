import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Plugin } from 'vite';

const EMPTY_ROOT = '<div id="root"></div>';

/**
 * React puts the preload links for images at the very front of what it renders. They belong in the
 * head, where the client would put them, so they are moved there.
 */
export function placeMarkup(html: string, markup: string): string {
  const hoisted = /^(?:<link rel="preload"[^>]*\/>)+/.exec(markup)?.[0] ?? '';
  const body = markup.slice(hoisted.length);
  if (!html.includes(EMPTY_ROOT)) throw new Error('prerender: the page has no empty #root');
  return html
    .replace('</head>', () => `    ${hoisted}\n  </head>`)
    .replace(EMPTY_ROOT, () => `<div id="root">${body}</div>`);
}

/**
 * After the build, draws each page's React tree to HTML and puts it inside `#root` of the built
 * file, so a reader that never runs JavaScript still sees the content. The browser still starts from
 * an empty root with `createRoot`, which replaces this markup; nothing is hydrated.
 */
export function prerenderPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'prerender',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    async closeBundle() {
      // the same loader the corpus scripts use: Vite itself runs the TypeScript, with no window
      const server = await createServer({
        configFile: false,
        // the same `@/` alias the app's own config sets
        resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
        appType: 'custom',
        logLevel: 'error',
        server: { middlewareMode: true, ws: false },
        optimizeDeps: { noDiscovery: true },
      });
      try {
        const { pageComponents, renderPage } = await server.ssrLoadModule('/src/seo/render.tsx');
        for (const file of Object.keys(pageComponents)) {
          const path = join(outDir, file);
          writeFileSync(path, placeMarkup(readFileSync(path, 'utf8'), renderPage(file)));
        }
      } finally {
        await server.close();
      }
    },
  };
}
