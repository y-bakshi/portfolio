// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Admission } from '../lib/admission';
import type { Env } from '../env';
import { createSession, encodeSession, MAX_SESSION_AGE } from '../lib/session';
import { cookieOf, idOf, json, parseSse, setup, SECRET, SITE, stub } from '../test/harness';

/** A cookie for a chat whose bot check lapsed an hour ago. */
async function lapsedCookie() {
  const now = Math.floor(Date.now() / 1000);
  const value = await encodeSession(
    { chatId: 'e'.repeat(32), issuedAt: now - 3 * 86400, verifiedUntil: now - 3600 },
    SECRET,
  );
  return `chat=${value}`;
}

/** The cookie the first version of the site wrote: the chat id and a signature, nothing else. */
async function legacyValue(id: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  return `${id}.${[...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

describe('POST /api/session', () => {
  it('creates a chat and sets a Secure, HttpOnly cookie', async () => {
    const { post, rows } = setup();
    const res = await post('/api/session', {});
    expect(await res.json()).toEqual({ ok: true });
    const line = res.headers.get('set-cookie')!;
    expect(line).toMatch(/^chat=v2\.[0-9a-f]{32}\.\d+\.\d+\.[0-9a-f]{64};/);
    expect(line).toContain('HttpOnly');
    expect(line).toContain('Secure');
    expect(line).toContain('SameSite=Lax');
    expect(line).toContain('Max-Age=7776000');
    expect((await rows('chats')).results).toHaveLength(1);
  });

  it('keeps the same chat, and does not run the check again, for a visitor whose check still counts', async () => {
    let checks = 0;
    const { post, rows } = setup({
      verifyHuman: async () => {
        checks++;
        return true;
      },
    });
    const first = await post('/api/session', {});
    const again = await post('/api/session', {}, cookieOf(first));
    // the cookie is written again, which starts its life over, and names the same chat
    expect(idOf(cookieOf(again)!)).toBe(idOf(cookieOf(first)!));
    expect(checks).toBe(1);
    expect((await rows('chats')).results).toHaveLength(1);
  });

  it('runs the check again, keeping the chat, when the last one has lapsed', async () => {
    let checks = 0;
    const { post, rows, ask } = setup({
      answerer: stub('a'),
      verifyHuman: async () => {
        checks++;
        return true;
      },
    });
    const old = await lapsedCookie();
    const res = await post('/api/session', {}, old);
    expect(res.status).toBe(200);
    expect(checks).toBe(1);
    const fresh = cookieOf(res)!;
    expect(idOf(fresh)).toBe(idOf(old));
    expect((await rows('chats')).results).toHaveLength(1);
    expect((await ask('hello', fresh)).status).toBe(200);
  });

  it('records why a check did not pass, without storing anything about the visitor', async () => {
    const { post, rows } = setup({ verifyHuman: async () => false });
    const res = await post('/api/session', {});
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      'verification_failed',
    );
    await post('/api/session', {}, undefined);
    const events = (await rows('events')).results as { type: string; data_json: string }[];
    expect(events.filter((e) => e.type === 'check_failed').map((e) => e.data_json)).toEqual([
      '{"reason":"no_token"}',
      '{"reason":"no_token"}',
    ]);
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

  it('turns a question with no bot check on record away with a code the page can act on', async () => {
    const strict = setup({ answerer: stub('a'), verifyHuman: async () => false });
    const res = await strict.askBare('hello');
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      'verification_required',
    );
    expect((await strict.rows('chats')).results).toHaveLength(0);
    expect((await strict.rows('messages')).results).toHaveLength(0);
    const events = (await strict.rows('events')).results as { type: string; data_json: string }[];
    expect(events).toMatchObject([{ type: 'check_needed', data_json: '{"reason":"no_cookie"}' }]);
  });

  it('turns a question away, before any limit or spend is touched, when the check has lapsed', async () => {
    let admissions = 0;
    const admission: Admission = {
      admit: async () => {
        admissions++;
        return { ok: true, settle: async () => {}, release: async () => {} };
      },
    };
    const ctx = setup({ answerer: stub('a'), admission });
    const res = await ctx.askBare('hello', await lapsedCookie());
    expect(res.status).toBe(403);
    expect(admissions).toBe(0);
    const events = (await ctx.rows('events')).results as { type: string; data_json: string }[];
    expect(events.map((e) => [e.type, e.data_json])).toEqual([
      ['check_needed', '{"reason":"lapsed"}'],
    ]);
  });

  it('keeps the chat of an older cookie, and asks it only for the check', async () => {
    const ctx = setup({ answerer: stub('a') });
    const first = cookieOf(await ctx.post('/api/session', {}))!;
    await (await ctx.ask('first question', first)).text();
    const id = idOf(first);
    const older = `chat=${await legacyValue(id)}`;
    // its chat is still there to read, for continuity
    const read = (await (await ctx.call('/api/chat', {}, older)).json()) as { messages: unknown[] };
    expect(read.messages).toHaveLength(2);
    // but a question needs the check, which keeps the same chat
    expect((await ctx.askBare('second', older)).status).toBe(403);
    const upgraded = cookieOf(await ctx.post('/api/session', {}, older))!;
    expect(idOf(upgraded)).toBe(id);
    await (await ctx.ask('second', upgraded)).text();
    const after = (await (await ctx.call('/api/chat', {}, upgraded)).json()) as {
      messages: unknown[];
    };
    expect(after.messages).toHaveLength(4);
  });

  it('renews the cookie when a question is asked, so a regular visitor keeps their chat', async () => {
    const ctx = setup({ answerer: stub('a') });
    const first = cookieOf(await ctx.post('/api/session', {}))!;
    const res = await ctx.ask('hello', first);
    await res.text();
    const renewed = res.headers.get('set-cookie')!;
    expect(renewed).toContain('Max-Age=7776000');
    expect(idOf(cookieOf(res)!)).toBe(idOf(first));
  });

  it('renews the cookie when the transcript is read, but sets none for a visitor with no cookie', async () => {
    const ctx = setup();
    const first = cookieOf(await ctx.post('/api/session', {}))!;
    const read = await ctx.call('/api/chat', {}, first);
    expect(read.headers.get('set-cookie')).toContain('Max-Age=7776000');
    expect((await ctx.call('/api/chat')).headers.get('set-cookie')).toBeNull();
  });

  it('lets a visitor who already passed the check keep asking with just the cookie', async () => {
    let human = true;
    const { post, ask } = setup({ answerer: stub('a'), verifyHuman: async () => human });
    const cookie = cookieOf(await post('/api/session', {}));
    human = false; // a bot check token is used once; the cookie is what proves it from now on
    expect((await ask('hello', cookie)).status).toBe(200);
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
  it('is treated as a new visitor, who has to pass the check before asking', async () => {
    const { ask, askBare, call, rows } = setup({ answerer: stub('a') });
    const first = await ask('q1');
    await first.text();
    const cookie = cookieOf(first)!;
    const forged = cookie.replace(/.$/, cookie.endsWith('0') ? '1' : '0');

    const empty = await call('/api/chat', {}, forged);
    expect(await empty.json()).toEqual({ messages: [] });
    expect((await askBare('q2', forged)).status).toBe(403);

    // asking the way the page does passes the check first and gets a chat of its own
    const second = await ask('q2');
    await second.text();
    expect(cookieOf(second)).not.toBe(cookie);
    expect((await rows('chats')).results).toHaveLength(2);
  });

  it('is restored as a chat when its signature is valid but the chat was deleted', async () => {
    const { askBare, rows } = setup({ answerer: stub('a') });
    const { value } = await createSession(SECRET);
    const res = await askBare('q', `chat=${value}`);
    await res.text();
    expect(res.status).toBe(200);
    expect((await rows('chats')).results).toHaveLength(1);
  });

  it('is not valid once a session has gone on for longer than the longest allowed', async () => {
    const { askBare } = setup({ answerer: stub('a') });
    const issued = Math.floor(Date.now() / 1000) - (MAX_SESSION_AGE + 60);
    const old = await createSession(SECRET, issued);
    // its bot check also lapsed long ago, and the whole session is past its end
    expect((await askBare('q', `chat=${old.value}`)).status).toBe(403);
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
