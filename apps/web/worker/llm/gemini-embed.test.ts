// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createGeminiEmbedder } from './gemini-embed';

const reply = (vectors: number[][]) =>
  new Response(JSON.stringify({ embeddings: vectors.map((values) => ({ values })) }));

describe('createGeminiEmbedder', () => {
  it('asks for 768 numbers per note, sends the key in a header, and returns unit-length vectors', async () => {
    const fetch = vi.fn(async () => reply([[3, 4]]));
    const [v] = await createGeminiEmbedder({ apiKey: 'secret', fetch }).embed(['hello']);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain('secret');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret');
    expect(JSON.parse(init.body as string).requests[0].outputDimensionality).toBe(768);
    expect(v).toEqual([0.6, 0.8]);
  });

  it('sends notes in batches of 50 and keeps their order', async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const n = JSON.parse(init!.body as string).requests.length as number;
      return reply(Array.from({ length: n }, () => [1, 0]));
    });
    const out = await createGeminiEmbedder({ apiKey: 'k', fetch }).embed(
      Array.from({ length: 120 }, (_, i) => `note ${i}`),
    );
    expect(out).toHaveLength(120);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('fails loudly on an error response or a short answer', async () => {
    const bad = createGeminiEmbedder({
      apiKey: 'k',
      fetch: async () => new Response('no', { status: 429 }),
    });
    await expect(bad.embed(['a'])).rejects.toThrow(/429/);
    const short = createGeminiEmbedder({ apiKey: 'k', fetch: async () => reply([]) });
    await expect(short.embed(['a'])).rejects.toThrow(/failed/);
  });
});
