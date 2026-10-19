// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createApp, MAX_BODY_BYTES } from './app';
import type { Env } from './env';
import { testDb } from './test/sqlite-d1';

const SITE = 'https://yashbakshi.com';

/** The app with a working in-memory database, called the way Cloudflare would. */
function setup() {
  const env = { DB: testDb(), SITE_ORIGIN: SITE } as unknown as Env;
  const app = createApp();
  return {
    env,
    call: (path: string, init?: RequestInit) => app.request(`${SITE}${path}`, init, env),
  };
}

describe('the résumé download', () => {
  const file = { body: 'pdf-bytes', httpEtag: '"abc"' };
  const withFiles = (get: () => unknown) =>
    ({ DB: testDb(), SITE_ORIGIN: SITE, FILES: { get } }) as unknown as Env;

  it('serves the stored file as a download', async () => {
    const res = await createApp().request(
      `${SITE}/resume.pdf`,
      undefined,
      withFiles(() => file),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('Yash_Bakshi_SWE.pdf');
  });

  it('opens the same file in the browser at /cv, for a link from a QR code', async () => {
    const res = await createApp().request(
      `${SITE}/cv`,
      undefined,
      withFiles(() => file),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toBe('inline; filename="Yash_Bakshi_SWE.pdf"');
    expect(await res.text()).toBe('pdf-bytes');
  });

  it('says so at /cv too when no file is stored', async () => {
    const res = await createApp().request(
      `${SITE}/cv`,
      undefined,
      withFiles(() => null),
    );
    expect(res.status).toBe(404);
  });

  it('says so, without an error page, when no file is stored', async () => {
    const res = await createApp().request(
      `${SITE}/resume.pdf`,
      undefined,
      withFiles(() => null),
    );
    expect(res.status).toBe(404);
  });
});

describe('the API foundation', () => {
  it('answers a cheap health check without touching the database', async () => {
    const { call } = setup();
    const res = await call('/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; db?: boolean };
    expect(body.ok).toBe(true);
    expect(body.db).toBeUndefined();
  });

  it('checks the database when asked to', async () => {
    const { call } = setup();
    const body = (await (await call('/api/health?db=1')).json()) as { db?: boolean };
    expect(body.db).toBe(true);
  });

  it('reports a database that does not answer as unavailable, without saying why', async () => {
    const { call, env } = setup();
    (env as unknown as { DB: unknown }).DB = {
      prepare: () => {
        throw new Error('secret connection detail');
      },
    };
    const res = await call('/api/health?db=1');
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });

  it('gives every response a request id and forbids caching', async () => {
    const { call } = setup();
    const res = await call('/api/health');
    expect(res.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns the standard error body for an unknown API address', async () => {
    const { call } = setup();
    const res = await call('/api/nope');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string }; requestId: string };
    expect(body.error.code).toBe('not_found');
    expect(body.requestId).toBe(res.headers.get('x-request-id'));
  });

  it('refuses a change that does not come from the site', async () => {
    const { call } = setup();
    const res = await call('/api/health', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');
  });

  it('refuses a change that carries no origin at all', async () => {
    const { call } = setup();
    expect((await call('/api/health', { method: 'POST' })).status).toBe(403);
  });

  it('lets a change through from the site, so it reaches the router', async () => {
    const { call } = setup();
    // there is no POST route yet, so getting a 404 (and not a 403) shows the origin check passed
    const res = await call('/api/health', { method: 'POST', headers: { origin: SITE } });
    expect(res.status).toBe(404);
  });

  it('refuses a body over the size limit', async () => {
    const { call } = setup();
    const res = await call('/api/health', {
      method: 'POST',
      headers: { origin: SITE, 'content-type': 'application/json' },
      body: 'x'.repeat(MAX_BODY_BYTES + 1),
    });
    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      'payload_too_large',
    );
  });
});
