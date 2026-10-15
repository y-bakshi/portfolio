// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Admission } from '../lib/admission';
import type { Env } from '../env';
import { createSession } from '../lib/session';
import { cookieOf, json, parseSse, setup, SECRET, SITE, stub } from '../test/harness';

describe('POST /api/session', () => {
  it('creates a chat and sets a Secure, HttpOnly cookie', async () => {
    const { post, rows } = setup();
    const res = await post('/api/session', {});
    expect(await res.json()).toEqual({ ok: true });
    const line = res.headers.get('set-cookie')!;
    expect(line).toMatch(/^chat=[0-9a-f]{32}\.[0-9a-f]{64};/);
    expect(line).toContain('HttpOnly');
    expect(line).toContain('Secure');
    expect(line).toContain('SameSite=Lax');
    expect(line).toContain('Max-Age=2592000');
    expect((await rows('chats')).results).toHaveLength(1);
  });

  it('does not set a second cookie for a visitor who already has one', async () => {
    const { post, rows } = setup();
    const first = await post('/api/session', {});
    const again = await post('/api/session', {}, cookieOf(first));
    expect(again.headers.get('set-cookie')).toBeNull();
    expect((await rows('chats')).results).toHaveLength(1);
  });

  it('refuses when the human check fails, and when admission refuses', async () => {
    const no = setup({ verifyHuman: async () => false });
    expect((await no.post('/api/session', {})).status).toBe(403);

    const admission: Admission = {
      admit: async (_r, _e, o) => {
        expect(o.kind).toBe('session');
        const { ApiError } = await import('../lib/http');
        return { ok: false, error: new ApiError(429, 'rate_limited', 'Slow down.') };
      },
    };
    const limited = setup({ admission });
    expect((await limited.post('/api/session', {})).status).toBe(429);
  });

  it('answers 503 when no secret is configured', async () => {
    const { app, env } = setup();
    const bare = { ...env, SESSION_SECRET: '' } as Env;
    const res = await app.request(
      `${SITE}/api/session`,
      { method: 'POST', headers: json, body: '{}' },
      bare,
    );
    expect(res.status).toBe(503);
  });
});

describe('a tampered or stale cookie', () => {
  it('is treated as a new visitor', async () => {
    const { ask, call, rows } = setup({ answerer: stub('a') });
    const first = await ask('q1');
    await first.text();
    const cookie = cookieOf(first)!;
    const forged = cookie.replace(/.$/, cookie.endsWith('0') ? '1' : '0');

    const empty = await call('/api/chat', {}, forged);
    expect(await empty.json()).toEqual({ messages: [] });

    const second = await ask('q2', forged);
    await second.text();
    expect(cookieOf(second)).toBeDefined();
    expect(cookieOf(second)).not.toBe(cookie);
    expect((await rows('chats')).results).toHaveLength(2);
  });

  it('is restored as a chat when its signature is valid but the chat was deleted', async () => {
    const { ask, rows } = setup({ answerer: stub('a') });
    const { value } = await createSession(SECRET);
    const res = await ask('q', `chat=${value}`);
    await res.text();
    expect(res.headers.get('set-cookie')).toBeNull();
    expect((await rows('chats')).results).toHaveLength(1);
  });
});

describe('GET /api/chat', () => {
  it('returns an empty list for a visitor with no cookie, and creates nothing', async () => {
    const { call, rows } = setup();
    const res = await call('/api/chat');
    expect(await res.json()).toEqual({ messages: [] });
    expect(res.headers.get('set-cookie')).toBeNull();
    expect((await rows('chats')).results).toHaveLength(0);
  });
});

describe('DELETE /api/chat', () => {
  it('removes the chat, messages and feedback and clears the cookie', async () => {
    const { ask, post, call, rows } = setup({ answerer: stub('a') });
    const res = await ask('q');
    const events = parseSse(await res.text());
    const cookie = cookieOf(res)!;
    await post('/api/feedback', { messageId: events[0].data.assistantMessageId, value: 1 }, cookie);
    expect((await rows('feedback')).results).toHaveLength(1);

    const del = await call('/api/chat', { method: 'DELETE', headers: json }, cookie);
    expect(await del.json()).toEqual({ ok: true });
    expect(del.headers.get('set-cookie')).toContain('Max-Age=0');
    for (const table of ['chats', 'messages', 'feedback']) {
      expect((await rows(table)).results, table).toHaveLength(0);
    }
  });

  it('answers ok even when there was no chat', async () => {
    const { call } = setup();
    const del = await call('/api/chat', { method: 'DELETE', headers: json });
    expect(del.status).toBe(200);
    expect(await del.json()).toEqual({ ok: true });
  });
});

describe('POST /api/feedback', () => {
  async function withAnswer() {
    const ctx = setup({ answerer: stub('a') });
    const res = await ctx.ask('q');
    const events = parseSse(await res.text());
    return {
      ...ctx,
      cookie: cookieOf(res)!,
      answerId: events[0].data.assistantMessageId as string,
      questionId: events[0].data.userMessageId as string,
    };
  }

  it('stores a thumb, replaces it on repeat, and shows it in the transcript', async () => {
    const { post, call, cookie, answerId, rows } = await withAnswer();
    expect(
      await (await post('/api/feedback', { messageId: answerId, value: 1 }, cookie)).json(),
    ).toEqual({ ok: true });
    await post('/api/feedback', { messageId: answerId, value: -1 }, cookie);
    expect((await rows('feedback')).results).toHaveLength(1);
    const body = (await (await call('/api/chat', {}, cookie)).json()) as {
      messages: { id: string; rating: number | null }[];
    };
    expect(body.messages.find((m) => m.id === answerId)!.rating).toBe(-1);
  });

  it('is a 404 from another chat, for a question, for an unknown id and with no cookie', async () => {
    const { post, answerId, questionId, ask } = await withAnswer();
    const other = await ask('someone else');
    await other.text();
    const otherCookie = cookieOf(other)!;
    for (const [id, cookie] of [
      [answerId, otherCookie],
      [questionId, undefined],
      ['missing', otherCookie],
      [answerId, undefined],
    ] as const) {
      const res = await post('/api/feedback', { messageId: id, value: 1 }, cookie);
      expect(res.status).toBe(404);
    }
  });

  it.each([
    [{ messageId: 'x', value: 0 }],
    [{ messageId: 'x', value: 2 }],
    [{ messageId: 'x', value: '1' }],
    [{ value: 1 }],
    [{ messageId: 5, value: 1 }],
  ])('rejects %j with 400', async (body) => {
    const { post } = setup();
    expect((await post('/api/feedback', body)).status).toBe(400);
  });
});
