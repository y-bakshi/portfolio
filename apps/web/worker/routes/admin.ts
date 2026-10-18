import type { Hono, MiddlewareHandler } from 'hono';
import type { AppEnv } from '../app';
import { ADMIN_JS } from '../admin/script';
import { ADMIN_HTML } from '../admin/page';
import { ADMIN_CSS } from '../admin/style';
import { ACCESS_HEADER, createAccessVerifier, isDevBypass } from '../lib/access';
import { systemClock, type Clock } from '../lib/clock';
import { listEvalRuns } from '../lib/eval-runs';
import { clampDays, getSummary } from '../lib/stats';
import { getTraffic, type Graphql } from '../lib/traffic';
import { corpusVersion } from '../rag/version';

type Deps = {
  fetch?: (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
  clock?: Clock;
  /** Asks Cloudflare for traffic numbers; tests pass their own so nothing leaves the machine. */
  graphql?: Graphql;
};

/** Never cached, never indexed, no framing; scripts and styles only from this address. */
const ADMIN_HEADERS = {
  'content-security-policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
  'x-content-type-options': 'nosniff',
};

/**
 * The owner-only view: the page, its script and style, and the JSON summary. Every one of them
 * goes through the Cloudflare Access check first, and refuses when Access is not set up.
 */
export function registerAdminRoutes(app: Hono<AppEnv>, deps: Deps = {}) {
  const clock = deps.clock ?? systemClock;
  const verify = createAccessVerifier({
    fetch: deps.fetch ?? ((url) => fetch(url)),
    clock,
  });

  const guard: MiddlewareHandler<AppEnv> = async (c, next) => {
    for (const [name, value] of Object.entries(ADMIN_HEADERS)) c.header(name, value);
    if (!isDevBypass(c.env, c.req.url)) await verify(c.req.header(ACCESS_HEADER), c.env);
    await next();
  };
  app.use('/admin', guard);
  app.use('/admin/*', guard);
  app.use('/api/admin/*', guard);

  app.get('/admin', (c) => c.body(ADMIN_HTML, 200, { 'content-type': 'text/html; charset=utf-8' }));
  app.get('/admin/app.js', (c) =>
    c.body(ADMIN_JS, 200, { 'content-type': 'text/javascript; charset=utf-8' }),
  );
  app.get('/admin/style.css', (c) =>
    c.body(ADMIN_CSS, 200, { 'content-type': 'text/css; charset=utf-8' }),
  );

  app.get('/api/admin/summary', async (c) => {
    const days = clampDays(c.req.query('days'));
    return c.json(await getSummary(c.env.DB, clock, { days }));
  });

  app.get('/api/admin/traffic', async (c) =>
    c.json(await getTraffic(c.env, clampDays(c.req.query('days')), clock, deps.graphql)),
  );

  /** Saved evaluations. A database without the table yet (the migration not applied) shows none. */
  app.get('/api/admin/evals', async (c) => {
    try {
      return c.json({ runs: await listEvalRuns(c.env.DB, corpusVersion()) });
    } catch {
      return c.json({ runs: [] });
    }
  });
}
