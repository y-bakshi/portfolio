// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../env';
import { costMicroUsd, PRICES } from './constants';
import { createGemini } from './gemini';
import { chain, fromEnv } from './index';
import { createMockProvider, mockEmbedder } from './mock';
import type { ChatRequest, ChatResult, FetchLike, LlmProvider } from './types';
import { createWorkersAi, createWorkersAiEmbedder } from './workersai';

const request: ChatRequest = {
  messages: [
    { role: 'system', content: 'rules' },
    { role: 'user', content: 'hi' },
  ],
};

const sse = (...events: unknown[]) =>
  new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''), {
    headers: { 'content-type': 'text/event-stream' },
  });

describe('gemini', () => {
  it('sends the key in a header, keeps the system prompt apart, and prices the usage', async () => {
    const fetch = vi.fn<FetchLike>(async () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: 'Hello' }] } }],
        usageMetadata: { promptTokenCount: 2000, candidatesTokenCount: 250 },
      }),
    );
    const gemini = createGemini({ apiKey: 'k', model: 'gemini-2.5-flash-lite', fetch });
    const out = await gemini.chat(request);
    expect(out).toMatchObject({ text: 'Hello', inputTokens: 2000, outputTokens: 250 });
    // 2000 * 0.25 + 250 * 1.5 micro-USD
    expect(out.costMicroUsd).toBe(875);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).not.toContain('key=');
    expect((init!.headers as Record<string, string>)['x-goog-api-key']).toBe('k');
    const body = JSON.parse(init!.body as string);
    expect(body.systemInstruction.parts[0].text).toBe('rules');
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'hi' }] }]);
  });

  it('streams pieces and returns the totals from the last event', async () => {
    const fetch: FetchLike = async (url) => {
      expect(url).toContain(':streamGenerateContent?alt=sse');
      return sse(
        { candidates: [{ content: { parts: [{ text: 'Hel' }] } }] },
        {
          candidates: [{ content: { parts: [{ text: 'lo' }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 2 },
        },
      );
    };
    const gen = createGemini({ apiKey: 'k', fetch }).chatStream!(request);
    const pieces: string[] = [];
    let step = await gen.next();
    while (!step.done) {
      pieces.push(step.value);
      step = await gen.next();
    }
    expect(pieces).toEqual(['Hel', 'lo']);
    expect(step.value).toMatchObject({ text: 'Hello', inputTokens: 10, outputTokens: 2 });
  });

  it('fails on an error status without putting the body in the message', async () => {
    const fetch: FetchLike = async () => new Response('secret prompt echo', { status: 500 });
    await expect(createGemini({ apiKey: 'k', fetch }).chat(request)).rejects.toThrow(
      /^gemini 500$/,
    );
  });

  it('never prices a model as free', () => {
    expect(costMicroUsd(PRICES['gemini-2.5-flash']!, 1_000_000, 0)).toBe(1_500_000);
  });
});

describe('workers ai', () => {
  it('chats through the binding and estimates tokens when none are reported', async () => {
    const ai = { run: vi.fn(async () => ({ response: 'Hi there' })) };
    const out = await createWorkersAi(ai).chat(request);
    expect(out.text).toBe('Hi there');
    expect(out.inputTokens).toBeGreaterThan(0);
  });

  it('embeds in batches and checks the count', async () => {
    const ai = {
      run: vi.fn(async (_m: string, input: unknown) => ({
        data: (input as { text: string[] }).text.map(() => [1, 0]),
      })),
    };
    const vectors = await createWorkersAiEmbedder(ai).embed(Array.from({ length: 120 }, () => 'x'));
    expect(vectors).toHaveLength(120);
    expect(ai.run).toHaveBeenCalledTimes(3);
    await expect(
      createWorkersAiEmbedder({ run: async () => ({ data: [] }) }).embed(['a']),
    ).rejects.toThrow();
  });
});

describe('the fallback chain', () => {
  const ok = (text: string): ChatResult => ({
    text,
    model: 'm',
    inputTokens: 1,
    outputTokens: 1,
    costMicroUsd: 0,
  });
  const failing: LlmProvider = {
    chat: async () => {
      throw new Error('down');
    },
  };

  it('moves to the next provider when the first throws', async () => {
    const out = await chain([failing, { chat: async () => ok('second') }]).chat(request);
    expect(out.text).toBe('second');
  });

  it('streams from the next provider if the first fails before any text', async () => {
    const second: LlmProvider = {
      chat: async () => ok('x'),
      async *chatStream() {
        yield 'b';
        return ok('b');
      },
    };
    const gen = chain([failing, second]).chatStream!(request);
    expect((await gen.next()).value).toBe('b');
  });

  it('does not switch model after text has gone out', async () => {
    const half: LlmProvider = {
      chat: async () => ok('x'),
      async *chatStream() {
        yield 'a';
        throw new Error('cut');
      },
    };
    const gen = chain([half, { chat: async () => ok('other') }]).chatStream!(request);
    await gen.next();
    await expect(gen.next()).rejects.toThrow('cut');
  });
});

describe('fromEnv', () => {
  const ai = { run: async () => ({ response: 'x', data: [[1]] }) };

  it('returns nothing without LLM_PROVIDER, so the keyword guide is used', () => {
    expect(fromEnv({} as Env)).toBeNull();
  });

  it('needs a key and the AI binding for gemini', () => {
    expect(fromEnv({ LLM_PROVIDER: 'gemini' } as Env)).toBeNull();
    expect(
      fromEnv({ LLM_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', AI: ai } as unknown as Env),
    ).not.toBeNull();
  });

  it('builds the mock and workers-ai setups', () => {
    expect(fromEnv({ LLM_PROVIDER: 'mock' } as Env)?.embedder).toBe(mockEmbedder);
    expect(fromEnv({ LLM_PROVIDER: 'workers-ai', AI: ai } as unknown as Env)).not.toBeNull();
  });
});

describe('the mock', () => {
  it('embeds the same text the same way and scores shared words higher', async () => {
    const [a, b, c] = await mockEmbedder.embed([
      'rust process monitor',
      'rust monitor',
      'poem sea',
    ]);
    const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * y[i]!, 0);
    expect(dot(a!, b!)).toBeGreaterThan(dot(a!, c!));
    expect((await mockEmbedder.embed(['rust process monitor']))[0]).toEqual(a);
  });

  it('answers deterministically from the first note and refuses without notes', async () => {
    const p = createMockProvider();
    const noNotes = await p.chat(request);
    expect(noNotes.text).toMatch(/not in my notes/i);
    const withNote = await p.chat({
      messages: [{ role: 'user', content: '<note id="a:b">\nFirst one. Second.\n</note>' }],
    });
    expect(withNote.text).toBe('From my notes: First one. [a:b]');
  });
});
