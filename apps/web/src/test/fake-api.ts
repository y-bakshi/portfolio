import { vi } from 'vitest';

const enc = new TextEncoder();
export const sse = (event: string, data: unknown) =>
  `event: ${event}
data: ${JSON.stringify(data)}

`;

/** A streamed chat answer as the API sends it: meta, one token per word, then done. */
export function answerStream(text: string, cites: string[], ids = ['u1', 'a1']) {
  const pieces = [
    sse('meta', { userMessageId: ids[0], assistantMessageId: ids[1] }),
    ...text.split(/(?<=\s)/).map((t) => sse('token', { text: t })),
    sse('done', { text, cites }),
  ];
  return new Response(
    new ReadableStream({
      start(c) {
        pieces.forEach((p) => c.enqueue(enc.encode(p)));
        c.close();
      },
    }),
  );
}

export type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

/** Fakes the API: each handler is looked up by "METHOD /path"; anything else fails like an outage. */
export function fakeApi(handlers: Record<string, Handler>) {
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const handler = handlers[`${init.method ?? 'GET'} ${url}`];
    if (!handler) throw new TypeError('offline');
    return handler(url, init);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** A guide that answers the given questions with the given text and sources, and nothing else. */
export function cannedGuide(answers: Record<string, [string, string[]]>) {
  return fakeApi({
    'GET /api/chat': () => Response.json({ messages: [] }),
    'POST /api/session': () => Response.json({ ok: true }),
    'POST /api/chat': (_url, init) => {
      const { message } = JSON.parse(init.body as string) as { message: string };
      const hit = answers[message];
      if (!hit) return new Response('{}', { status: 500 });
      return answerStream(hit[0], hit[1]);
    },
  });
}
