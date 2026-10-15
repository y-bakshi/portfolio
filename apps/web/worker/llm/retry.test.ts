// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { retryOnce } from './retry';

describe('retryOnce', () => {
  it('sends a request again after a one-off 403 and returns the second answer', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('no', { status: 403 }))
      .mockResolvedValueOnce(new Response('yes'));
    const res = await retryOnce(fetch, 0)('https://example.test');
    expect(await res.text()).toBe('yes');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('tries only once more, and not at all for a good or a plain bad request', async () => {
    const down = vi.fn(async () => new Response('x', { status: 503 }));
    expect((await retryOnce(down, 0)('u')).status).toBe(503);
    expect(down).toHaveBeenCalledTimes(2);
    const ok = vi.fn(async () => new Response('x'));
    await retryOnce(ok, 0)('u');
    expect(ok).toHaveBeenCalledTimes(1);
    const bad = vi.fn(async () => new Response('x', { status: 400 }));
    await retryOnce(bad, 0)('u');
    expect(bad).toHaveBeenCalledTimes(1);
  });
});
