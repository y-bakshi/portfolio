/** Shared helpers for the route tests: an app with a fresh database, and a reader for SSE. */
import { createApp } from '../app';
import type { Deps } from '../deps';
import type { Env } from '../env';
import type { Answerer } from '../lib/answerer';
import { testDb } from './sqlite-d1';

export const SITE = 'https://yashbakshi.com';
export const SECRET = 'test-secret-not-real';
export const json = { 'content-type': 'application/json', origin: SITE };

export type Sse = { event: string; data: Record<string, unknown> };

export function parseSse(text: string): Sse[] {
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const event = /^event: (.*)$/m.exec(block)![1];
      const data = JSON.parse(/^data: (.*)$/m.exec(block)![1]) as Record<string, unknown>;
      return { event, data };
    });
}

export function setup(deps: Partial<Deps> = {}) {
  let n = 0;
  const env = { DB: testDb(), SITE_ORIGIN: SITE, SESSION_SECRET: SECRET } as unknown as Env;
  const app = createApp({ newId: () => `id-${++n}`, ...deps });
  const call = (path: string, init: RequestInit = {}, cookie?: string) =>
    app.request(
      `${SITE}${path}`,
      { ...init, headers: { ...(cookie ? { cookie } : {}), ...(init.headers as object) } },
      env,
    );
  const post = (path: string, body: unknown, cookie?: string) =>
    call(path, { method: 'POST', headers: json, body: JSON.stringify(body) }, cookie);
  const ask = (message: string, cookie?: string) => post('/api/chat', { message }, cookie);
  const rows = (table: string) => env.DB.prepare(`SELECT * FROM ${table}`).all();
  return { env, app, call, post, ask, rows };
}

/** The `chat=...` pair from a response, as a Cookie request header. */
export function cookieOf(res: Response) {
  const line = res.headers.get('set-cookie');
  return line ? line.split(';')[0] : undefined;
}

export const stub = (text: string, cites: string[] = []): Answerer => ({
  answer: async () => ({ text, cites }),
});
