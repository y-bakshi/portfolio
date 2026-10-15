// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildApp } from './build';
import type { Env } from './env';
import { capsFrom } from './lib/budget';
import { createAdmission } from './lib/protect';
import { cookieOf, json, parseSse, SECRET, SITE } from './test/harness';
import { localGuard } from './test/local-guard';
import { testDb } from './test/sqlite-d1';

const IP = '203.0.113.77';

/** The real app, wired as in production, with an in-memory database, guard and a clock the test moves. */
function setup(vars: Record<string, string> = {}) {
  let now = Date.UTC(2026, 9, 14, 12, 0, 0);
  const clock = () => now;
  const env = {
    DB: testDb(),
    SITE_ORIGIN: SITE,
    SESSION_SECRET: SECRET,
    HMAC_SECRET: 'test-hmac-secret',
    ...vars,
  } as unknown as Env;
  const guard = localGuard(clock, capsFrom(env));
  const app = buildApp(env, { clock, admission: createAdmission({ clock, guard: () => guard }) });
  const call = (path: string, init: RequestInit = {}, cookie?: string) =>
    app.request(
      `${SITE}${path}`,
      {
        ...init,
        headers: {
          'CF-Connecting-IP': IP,
          ...(cookie ? { cookie } : {}),
          ...(init.headers as object),
        },
      },
      env,
    );
  const post = (path: string, body: unknown, cookie?: string) =>
    call(path, { method: 'POST', headers: json, body: JSON.stringify(body) }, cookie);
  const events = async () =>
    (await env.DB.prepare('SELECT type, chat_id, data_json FROM events ORDER BY id').all())
      .results as {
      type: string;
      chat_id: string | null;
      data_json: string | null;
    }[];
  return { env, call, post, events, tick: (ms: number) => (now += ms) };
}

describe('the wired app', () => {
  it('stores a conversation and records what happened, without the words or the address', async () => {
    const { env, post, events } = setup();
    const session = await post('/api/session', {});
    expect(session.status).toBe(200);
    const cookie = cookieOf(session)!;

    const res = await post('/api/chat', { message: 'Tell me about his education' }, cookie);
    const stream = parseSse(await res.text());
    expect(stream.at(-1)?.event).toBe('done');

    const recorded = await events();
    expect(recorded.map((e) => e.type)).toEqual(['chat_started', 'question_asked', 'answer_shown']);
    const chatId = cookie.split('=')[1].split('.')[0];
    expect(recorded.every((e) => e.chat_id === chatId)).toBe(true);
    expect(JSON.parse(recorded[2].data_json!).latencyMs).toBeTypeOf('number');

    // nothing the visitor typed and nothing that identifies them is in an event or anywhere stored
    const stored = JSON.stringify([
      ...recorded,
      ...(await env.DB.prepare('SELECT * FROM chats').all()).results,
    ]);
    expect(stored).not.toContain('education');
    expect(stored).not.toContain(IP);
  });

  it('refuses a fourth question inside a minute, says when to come back, and records it', async () => {
    const { post, events, tick } = setup();
    const cookie = cookieOf(await post('/api/session', {}))!;
    for (let i = 0; i < 3; i++) {
      expect((await post('/api/chat', { message: `question ${i}` }, cookie)).status).toBe(200);
    }
    const refused = await post('/api/chat', { message: 'one too many' }, cookie);
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    const body = (await refused.json()) as { error: { code: string; retryAt: string } };
    expect(body.error.code).toBe('rate_limited');
    // the test clock starts at noon UTC, and the limit frees up within the next minute
    expect(Date.parse(body.error.retryAt)).toBeGreaterThan(Date.UTC(2026, 9, 14, 12, 0, 0));

    const limited = (await events()).filter((e) => e.type === 'rate_limited');
    expect(limited).toHaveLength(1);
    expect(JSON.parse(limited[0].data_json!)).toEqual({ scope: 'chat' });

    tick(61_000);
    expect((await post('/api/chat', { message: 'later' }, cookie)).status).toBe(200);
  });

  it('stops paid answers when the spending cap is reached, and says the built-in answers still work', async () => {
    const { post, events } = setup({ BUDGET_DAY_MICRO_USD: '1' });
    const cookie = cookieOf(await post('/api/session', {}))!;
    const res = await post('/api/chat', { message: 'hello' }, cookie);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('unavailable');
    expect(body.error.message).toMatch(/built-in answers/i);
    expect(JSON.parse((await events()).find((e) => e.type === 'rate_limited')!.data_json!)).toEqual(
      {
        scope: 'budget',
      },
    );
  });

  it('stops everything at once when the kill switch is on', async () => {
    const { post } = setup({ KILL_SWITCH: 'true' });
    const cookie = cookieOf(await post('/api/session', {}))!;
    expect((await post('/api/chat', { message: 'hello' }, cookie)).status).toBe(503);
  });

  it('records a feedback thumb, and a click on a "Show on the page" button', async () => {
    const { post, events } = setup();
    const cookie = cookieOf(await post('/api/session', {}))!;
    const streamed = parseSse(await (await post('/api/chat', { message: 'hello' }, cookie)).text());
    const messageId = (
      streamed.find((e) => e.event === 'meta')!.data as { assistantMessageId: string }
    ).assistantMessageId;

    expect((await post('/api/feedback', { messageId, value: 1 }, cookie)).status).toBe(200);
    expect(
      (await post('/api/events', { type: 'cite_clicked', sourceId: 'testpilot' }, cookie)).status,
    ).toBe(204);
    expect(
      (await post('/api/events', { type: 'cite_clicked', sourceId: 'not-a-card' }, cookie)).status,
    ).toBe(400);

    const types = (await events()).map((e) => e.type);
    expect(types).toContain('feedback');
    const click = (await events()).find((e) => e.type === 'cite_clicked')!;
    expect(JSON.parse(click.data_json!)).toEqual({ sourceId: 'testpilot' });
    expect(click.chat_id).toBe(cookie.split('=')[1].split('.')[0]);
  });

  it('keeps the owner view closed to everyone until it is set up', async () => {
    const { call } = setup();
    expect([401, 403]).toContain((await call('/api/admin/summary')).status);
    expect([401, 403]).toContain((await call('/admin')).status);
  });
});
