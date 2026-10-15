// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import type { Env } from '../env';
import { registerAdminRoutes } from './admin';
import { registerEventRoutes } from './events';
import { testDb } from '../test/sqlite-d1';
import { AUD, fakeCerts, goodClaims, makeKeys, signToken, TEAM } from '../test/access-token';

const SITE = 'https://yashbakshi.com';
const NOW = Date.UTC(2026, 9, 14, 12);

let keys: Awaited<ReturnType<typeof makeKeys>>;
beforeAll(async () => {
  keys = await makeKeys();
});

function setup(extra: Partial<Env> = {}, getChatId?: () => string | null) {
  const db = testDb();
  const env = {
    DB: db,
    SITE_ORIGIN: SITE,
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ...extra,
  } as unknown as Env;
  const app = createApp();
  registerAdminRoutes(app, { fetch: fakeCerts([keys.jwk]).fetch, clock: () => NOW });
  registerEventRoutes(app, { getChatId, clock: () => NOW });
  return { db, call: (url: string, init?: RequestInit) => app.request(url, init, env) };
}
const signed = async () => ({
  headers: { 'cf-access-jwt-assertion': await signToken(keys.privateKey, goodClaims(NOW)) },
});

describe('admin routes', () => {
  it('refuse every request without a token', async () => {
    const { call } = setup();
    for (const path of ['/admin', '/admin/app.js', '/admin/style.css', '/api/admin/summary']) {
      const res = await call(`${SITE}${path}`);
      expect(res.status, path).toBe(401);
      expect(res.headers.get('x-robots-tag')).toBe('noindex');
    }
  });

  it('refuse everything when Access is not configured, even with a token', async () => {
    const { call } = setup({ ACCESS_AUD: undefined });
    const res = await call(`${SITE}/api/admin/summary`, await signed());
    expect(res.status).toBe(403);
  });

  it('serve the page, script and style with strict headers', async () => {
    const { call } = setup();
    const page = await call(`${SITE}/admin`, await signed());
    expect(page.status).toBe(200);
    expect(page.headers.get('content-type')).toContain('text/html');
    expect(page.headers.get('content-security-policy')).toBe(
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    );
    expect(page.headers.get('cache-control')).toBe('no-store');
    expect(page.headers.get('x-robots-tag')).toBe('noindex');
    const script = await call(`${SITE}/admin/app.js`, await signed());
    const code = await script.text();
    expect(script.headers.get('content-type')).toContain('javascript');
    expect(code).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/);
    expect(() => new Function(code)).not.toThrow();
    expect(
      (await call(`${SITE}/admin/style.css`, await signed())).headers.get('content-type'),
    ).toContain('text/css');
  });

  it('return the summary as JSON', async () => {
    const { call, db } = setup();
    db.raw
      .prepare("INSERT INTO events (type, created_at) VALUES ('chat_started', ?)")
      .run(NOW - 1000);
    const res = await call(`${SITE}/api/admin/summary?days=7`, await signed());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { range: { days: number }; totals: { chats: number } };
    expect(body.range.days).toBe(7);
    expect(body.totals.chats).toBe(1);
  });

  it('let localhost skip Access only with the bypass flag', async () => {
    const off = setup();
    expect((await off.call('http://localhost:8788/admin')).status).toBe(401);
    const on = setup({ ADMIN_DEV_BYPASS: 'true', ACCESS_AUD: undefined });
    expect((await on.call('http://localhost:8788/admin')).status).toBe(200);
    expect((await on.call(`${SITE}/admin`)).status).toBe(403);
  });
});

describe('POST /api/events', () => {
  const post = (body: unknown) => ({
    method: 'POST',
    headers: { origin: SITE, 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const events = (db: ReturnType<typeof testDb>) =>
    db.raw.prepare('SELECT chat_id, type, data_json FROM events').all();

  it('records a cite click for a known card and returns 204', async () => {
    const { call, db } = setup({}, () => 'chat-9');
    const res = await call(
      `${SITE}/api/events`,
      post({ type: 'cite_clicked', sourceId: 'testpilot' }),
    );
    expect(res.status).toBe(204);
    expect(events(db)).toEqual([
      { chat_id: 'chat-9', type: 'cite_clicked', data_json: '{"sourceId":"testpilot"}' },
    ]);
  });

  it('accepts the contact block and a role, with no chat id by default', async () => {
    const { call, db } = setup();
    await call(`${SITE}/api/events`, post({ type: 'cite_clicked', sourceId: 'contact' }));
    await call(`${SITE}/api/events`, post({ type: 'cite_clicked', sourceId: 'thryv' }));
    expect(events(db)).toHaveLength(2);
    expect((events(db)[0] as { chat_id: unknown }).chat_id).toBeNull();
  });

  it('refuses other types, unknown cards, bad bodies and foreign origins', async () => {
    const { call, db } = setup();
    for (const body of [
      { type: 'panel_opened' },
      { type: 'cite_clicked', sourceId: 'not-a-card' },
      { type: 'cite_clicked', sourceId: 42 },
      { type: 'answer_shown', sourceId: 'testpilot' },
      'not json',
    ]) {
      expect((await call(`${SITE}/api/events`, post(body))).status).toBe(400);
    }
    const foreign = post({ type: 'cite_clicked', sourceId: 'contact' });
    foreign.headers.origin = 'https://evil.example';
    expect((await call(`${SITE}/api/events`, foreign)).status).toBe(403);
    expect(events(db)).toHaveLength(0);
  });
});
