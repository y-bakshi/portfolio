import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { defaultDeps, type Deps } from './deps';
import type { Env } from './env';
import { ApiError, errorBody, fromSiteOrigin } from './lib/http';
import { retryAfterSeconds } from './lib/protect';
import { registerChatRoutes } from './routes/chat';

export type AppEnv = { Bindings: Env; Variables: { requestId: string } };

/** The biggest request body any API route accepts. A chat message is at most 1,000 characters. */
export const MAX_BODY_BYTES = 8 * 1024;

/** Builds the API. Only addresses under /api reach the Worker; the site itself is served as files. */
export function createApp(deps: Partial<Deps> = {}) {
  const app = new Hono<AppEnv>();

  // every response carries an id, so a failure can be traced from a report
  app.use('/api/*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('x-request-id', requestId);
    c.header('cache-control', 'no-store');
    await next();
  });

  // anything that changes something must come from the site's own address
  app.use('/api/*', async (c, next) => {
    const own = new URL(c.req.url).origin;
    if (!fromSiteOrigin(c.req.method, c.req.header('origin') ?? null, own, c.env.SITE_ORIGIN)) {
      throw new ApiError(403, 'forbidden', 'This request did not come from the site.');
    }
    await next();
  });

  app.use(
    '/api/*',
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: () => {
        throw new ApiError(413, 'payload_too_large', 'That request is too large.');
      },
    }),
  );

  /** Cheap by default; `?db=1` also checks that the database answers. */
  app.get('/api/health', async (c) => {
    const body: { ok: boolean; service: string; time: string; db?: boolean } = {
      ok: true,
      service: 'portfolio-guide',
      time: new Date().toISOString(),
    };
    if (c.req.query('db') === '1') {
      try {
        await c.env.DB.prepare('SELECT 1').first();
        body.db = true;
      } catch {
        throw new ApiError(503, 'unavailable', 'The database is not answering.');
      }
    }
    return c.json(body);
  });

  /** The résumé lives in storage, not in the repository, so it can change without a deploy. */
  app.get('/resume.pdf', async (c) => {
    const file = await c.env.FILES?.get('resume.pdf');
    if (!file) return c.text('The résumé is not available right now.', 404);
    return new Response(file.body as unknown as ReadableStream, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="Yash_Bakshi_Resume.pdf"',
        'cache-control': 'public, max-age=300',
        etag: file.httpEtag,
      },
    });
  });

  registerChatRoutes(app, { ...defaultDeps, ...deps });

  app.notFound((c) => {
    const error = new ApiError(404, 'not_found', 'There is nothing at this address.');
    return c.json(errorBody(error, c.get('requestId') ?? crypto.randomUUID()), 404);
  });

  app.onError((err, c) => {
    const requestId = c.get('requestId') ?? crypto.randomUUID();
    if (err instanceof ApiError) {
      const wait = retryAfterSeconds(err);
      if (wait > 0) c.header('retry-after', String(wait));
      return c.json(errorBody(err, requestId), err.status);
    }
    // an unexpected failure: say nothing about the cause to the caller, and keep it for the logs
    console.error('unhandled error', requestId, err);
    return c.json(
      errorBody(new ApiError(500, 'internal', 'Something went wrong.'), requestId),
      500,
    );
  });

  return app;
}
