// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { Answerer } from '../lib/answerer';
import { cookieOf, json, parseSse, setup, SITE, stub } from '../test/harness';

describe('POST /api/chat', () => {
  it('creates the chat and cookie on the first message and streams meta, tokens and done', async () => {
    const { ask, rows } = setup({ answerer: stub('Hello there friend', ['testpilot']) });
    const res = await ask('How does TestPilot use RAG?');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(cookieOf(res)).toMatch(/^chat=/);
    const events = parseSse(await res.text());
    expect(events.map((e) => e.event)).toEqual(['meta', 'token', 'token', 'token', 'done']);
    expect(events[0].data).toEqual({ userMessageId: 'id-1', assistantMessageId: 'id-2' });
    expect(
      events
        .filter((e) => e.event === 'token')
        .map((e) => e.data.text)
        .join(''),
    ).toBe('Hello there friend');
    expect(events.at(-1)!.data).toEqual({ text: 'Hello there friend', cites: ['testpilot'] });
    const stored = (await rows('messages')).results as { role: string; text: string }[];
    expect(stored.map((m) => [m.role, m.text])).toEqual([
      ['user', 'How does TestPilot use RAG?'],
      ['assistant', 'Hello there friend'],
    ]);
  });

  it('continues the same chat when the cookie comes back, and a refresh returns the transcript', async () => {
    const { ask, call, rows } = setup({ answerer: stub('An answer.') });
    const first = await ask('First question');
    await first.text();
    const cookie = cookieOf(first)!;
    const second = await ask('Second question', cookie);
    expect(second.headers.get('set-cookie')).toBeNull();
    await second.text();
    expect((await rows('chats')).results).toHaveLength(1);

    const res = await call('/api/chat', {}, cookie);
    const body = (await res.json()) as { messages: { role: string; text: string }[] };
    expect(body.messages.map((m) => m.text)).toEqual([
      'First question',
      'An answer.',
      'Second question',
      'An answer.',
    ]);
    expect(body.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(Object.keys(body.messages[1]).sort()).toEqual(
      ['cites', 'createdAt', 'id', 'rating', 'role', 'text'].sort(),
    );
  });

  it('gives the answerer the last 6 stored turns, and the redacted question', async () => {
    const seen: { question: string; history: string[] }[] = [];
    const answerer: Answerer = {
      answer: async (question, history) => {
        seen.push({ question, history: history.map((t) => t.text) });
        return { text: `a${seen.length}`, cites: [] };
      },
    };
    const { ask } = setup({ answerer });
    let cookie: string | undefined;
    for (let i = 1; i <= 5; i++) {
      const res = await ask(`q${i}`, cookie);
      cookie ??= cookieOf(res);
      await res.text();
    }
    expect(seen[0].history).toEqual([]);
    expect(seen[4].history).toEqual(['q2', 'a2', 'q3', 'a3', 'q4', 'a4']);

    const last = await ask('mail me at me@example.com or 480-555-0123', cookie);
    await last.text();
    expect(seen[5].question).toBe('mail me at [email] or [phone]');
  });

  it('tells the answerer which page is open, and stores only what was typed', async () => {
    const seen: string[] = [];
    const answerer: Answerer = {
      answer: async (question) => {
        seen.push(question);
        return { text: 'ok', cites: [] };
      },
    };
    const { post, rows } = setup({ answerer });
    await (
      await post('/api/chat', {
        message: 'what is this project about',
        page: '/projects/testpilot/',
      })
    ).text();
    await (await post('/api/chat', { message: 'hello', page: '/not/a/page' })).text();
    expect(seen[0]).toBe(
      'The visitor is reading the case study page for TestPilot.\nwhat is this project about',
    );
    expect(seen[1]).toBe('hello');
    const stored = JSON.stringify((await rows('messages')).results);
    expect(stored).toContain('what is this project about');
    expect(stored).not.toContain('The visitor is reading');
  });

  it('stores the question and answer redacted, and sends the redacted answer', async () => {
    const { ask, rows } = setup({ answerer: stub('Write to boss@example.com now', []) });
    const res = await ask('my number is 480 555 0123');
    const done = parseSse(await res.text()).at(-1)!;
    expect(done.data.text).toBe('Write to [email] now');
    const stored = (await rows('messages')).results as { text: string }[];
    expect(stored.map((m) => m.text)).toEqual(['my number is [phone]', 'Write to [email] now']);
  });

  it('keeps only cites that are real cards', async () => {
    const { ask } = setup({
      answerer: stub('See these', ['testpilot', 'made-up', 'contact', 'testpilot']),
    });
    const done = parseSse(await (await ask('q')).text()).at(-1)!;
    expect(done.data.cites).toEqual(['testpilot', 'contact']);
  });

  it('stores answer details when the answerer gives them, and settles the cost', async () => {
    const settle = vi.fn(async () => {});
    const release = vi.fn(async () => {});
    const admit = vi.fn(async () => ({ ok: true as const, settle, release }));
    const answerer: Answerer = {
      answer: async () => ({
        text: 'ok',
        cites: [],
        meta: {
          model: 'm1',
          retrievalIds: ['c1'],
          topScore: 0.5,
          inputTokens: 9,
          costMicroUsd: 77,
        },
      }),
    };
    const { ask, rows } = setup({ answerer, admission: { admit } });
    await (await ask('q')).text();
    expect((admit.mock.calls[0] as unknown[])[2]).toEqual({ kind: 'chat', maxCostMicroUsd: 5000 });
    expect(settle).toHaveBeenCalledWith(77);
    expect(release).not.toHaveBeenCalled();
    const row = ((await rows('messages')).results as Record<string, unknown>[])[1];
    expect(row).toMatchObject({ model: 'm1', retrieval_ids_json: '["c1"]', top_score: 0.5 });
    expect(row.latency_ms).toBeTypeOf('number');
  });

  it('streams an answerer own pieces', async () => {
    const answerer: Answerer = {
      answer: async () => {
        throw new Error('unused');
      },
      async *stream() {
        yield 'He';
        yield 'llo';
        return { text: 'Hello', cites: [] };
      },
    };
    const { ask } = setup({ answerer });
    const events = parseSse(await (await ask('q')).text());
    expect(events.filter((e) => e.event === 'token').map((e) => e.data.text)).toEqual([
      'He',
      'llo',
    ]);
  });

  it('sends an error event and releases the reservation when the answerer throws', async () => {
    const settle = vi.fn(async () => {});
    const release = vi.fn(async () => {});
    const answerer: Answerer = {
      answer: async () => {
        throw new Error('model down: secret detail');
      },
    };
    const { ask, rows } = setup({
      answerer,
      admission: { admit: async () => ({ ok: true, settle, release }) },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const text = await (await ask('q')).text();
    const events = parseSse(text);
    expect(events.map((e) => e.event)).toEqual(['meta', 'error']);
    expect(events[1].data.code).toBe('internal');
    expect(text).not.toContain('secret detail');
    expect(release).toHaveBeenCalledTimes(1);
    expect(settle).not.toHaveBeenCalled();
    // the question is kept, but no answer was stored
    expect((await rows('messages')).results).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it('finishes and stores the answer even when the client never reads the stream', async () => {
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => (finish = resolve));
    const waited: Promise<unknown>[] = [];
    const answerer: Answerer = {
      answer: async () => {
        await gate;
        return { text: 'done anyway', cites: [] };
      },
    };
    const { app, env, rows } = setup({ answerer });
    const res = await app.request(
      `${SITE}/api/chat`,
      { method: 'POST', headers: json, body: JSON.stringify({ message: 'q' }) },
      env,
      { waitUntil: (p: Promise<unknown>) => waited.push(p), passThroughOnException() {} } as never,
    );
    await res.body!.cancel(); // the browser went away
    finish();
    await Promise.all(waited);
    expect(waited).toHaveLength(1);
    const stored = (await rows('messages')).results as { text: string }[];
    expect(stored.map((m) => m.text)).toEqual(['q', 'done anyway']);
  });
});
