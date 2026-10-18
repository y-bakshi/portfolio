import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiFailure,
  askStream,
  clearChat,
  createSseParser,
  loadChat,
  sendFeedback,
  startSession,
  type SseEvent,
} from './api';

const enc = new TextEncoder();

/** A response whose body arrives in the given pieces, so a test can cut an event anywhere. */
function streamOf(pieces: string[], init: ResponseInit = { status: 200 }) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of pieces) controller.enqueue(enc.encode(p));
      controller.close();
    },
  });
  return new Response(body, init);
}

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const meta = sse('meta', { userMessageId: 'u1', assistantMessageId: 'a1' });
const done = sse('done', { text: 'Hello there', cites: ['testpilot'] });

const mockFetch = (impl: (url: string, init: RequestInit) => Promise<Response>) => {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
};

afterEach(() => vi.unstubAllGlobals());

describe('createSseParser', () => {
  it('parses whole events', () => {
    const events: SseEvent[] = [];
    createSseParser((e) => events.push(e))(meta + done);
    expect(events.map((e) => e.event)).toEqual(['meta', 'done']);
    expect(events[1].data).toEqual({ text: 'Hello there', cites: ['testpilot'] });
  });

  it('waits for the rest of an event cut anywhere, even in the middle of a word', () => {
    const whole = meta + sse('token', { text: 'He llo' }) + done;
    for (let cut = 1; cut < whole.length; cut += 7) {
      const events: SseEvent[] = [];
      const push = createSseParser((e) => events.push(e));
      push(whole.slice(0, cut));
      push(whole.slice(cut));
      expect(
        events.map((e) => e.event),
        `cut at ${cut}`,
      ).toEqual(['meta', 'token', 'done']);
    }
  });

  it('handles CRLF line ends and skips broken or empty events', () => {
    const events: SseEvent[] = [];
    const push = createSseParser((e) => events.push(e));
    push('event: token\r\ndata: {"text":"a"}\r\n\r\n');
    push('event: token\ndata: {not json\n\n');
    push(': a comment\n\n');
    expect(events).toEqual([{ event: 'token', data: { text: 'a' } }]);
  });
});

describe('askStream', () => {
  it('posts the message with the cookie and returns the finished answer, reporting each token', async () => {
    const fetchMock = mockFetch(async () =>
      streamOf([meta, sse('token', { text: 'Hello ' }), sse('token', { text: 'there' }), done]),
    );
    const tokens: string[] = [];
    const result = await askStream('hi', (t) => tokens.push(t));
    expect(tokens).toEqual(['Hello ', 'there']);
    expect(result).toEqual({
      userMessageId: 'u1',
      assistantMessageId: 'a1',
      text: 'Hello there',
      cites: ['testpilot'],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('same-origin');
    expect(JSON.parse(init.body as string)).toEqual({ message: 'hi' });
  });

  it('copes with an event split across network chunks', async () => {
    const whole = meta + sse('token', { text: 'Hello' }) + done;
    mockFetch(async () => streamOf([whole.slice(0, 20), whole.slice(20, 61), whole.slice(61)]));
    const result = await askStream('hi', () => {});
    expect(result.text).toBe('Hello there');
  });

  it('fails on an error event', async () => {
    mockFetch(async () => streamOf([meta, sse('error', { code: 'internal', message: 'Nope.' })]));
    await expect(askStream('hi', () => {})).rejects.toThrow('Nope.');
  });

  it('fails when the stream ends before the answer is done', async () => {
    mockFetch(async () => streamOf([meta, sse('token', { text: 'Hel' })]));
    await expect(askStream('hi', () => {})).rejects.toBeInstanceOf(ApiFailure);
  });

  it.each([429, 500, 503, 403])('fails with the status on a %s', async (status) => {
    mockFetch(async () => new Response('{}', { status }));
    await expect(askStream('hi', () => {})).rejects.toMatchObject({ status });
  });

  it('fails cleanly when the network is down', async () => {
    mockFetch(async () => {
      throw new TypeError('offline');
    });
    await expect(askStream('hi', () => {})).rejects.toBeInstanceOf(ApiFailure);
  });

  it('gives up when the stream goes quiet for too long', async () => {
    vi.useFakeTimers();
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new DOMException('x', 'AbortError')));
        }),
    );
    const outcome = askStream('hi', () => {}).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(25_000);
    expect(await outcome).toBeInstanceOf(ApiFailure);
    vi.useRealTimers();
  });
});

describe('the small calls', () => {
  it('startSession posts to /api/session', async () => {
    const fetchMock = mockFetch(async () => Response.json({ ok: true }));
    await startSession();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/session');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(fetchMock.mock.calls[0][1].credentials).toBe('same-origin');
  });

  it('loadChat returns the messages, tolerating odd fields', async () => {
    mockFetch(async () =>
      Response.json({
        messages: [
          { id: 'u1', role: 'user', text: 'q', cites: [], createdAt: 'x', rating: null },
          { id: 'a1', role: 'assistant', text: 'a', cites: 'bad', createdAt: 'x', rating: 1 },
        ],
      }),
    );
    expect(await loadChat()).toEqual([
      { id: 'u1', role: 'user', text: 'q', cites: [], rating: null },
      { id: 'a1', role: 'assistant', text: 'a', cites: [], rating: 1 },
    ]);
  });

  it('loadChat rejects a reply that is not a transcript, and an error status', async () => {
    mockFetch(async () => Response.json({ nope: true }));
    await expect(loadChat()).rejects.toBeInstanceOf(ApiFailure);
    mockFetch(async () => new Response('{}', { status: 500 }));
    await expect(loadChat()).rejects.toMatchObject({ status: 500 });
  });

  it('clearChat sends DELETE and sendFeedback sends the id and value', async () => {
    const fetchMock = mockFetch(async () => Response.json({ ok: true }));
    await clearChat();
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    await sendFeedback('a1', -1);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/feedback');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      messageId: 'a1',
      value: -1,
    });
  });

  it('times out a call that never answers', async () => {
    vi.useFakeTimers();
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new DOMException('x', 'AbortError')));
        }),
    );
    const outcome = loadChat().catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await outcome).toBeInstanceOf(ApiFailure);
    vi.useRealTimers();
  });
});
