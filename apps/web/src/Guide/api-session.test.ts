import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./turnstile', () => ({ getTurnstileToken: vi.fn() }));

import { startSession } from './api';
import { getTurnstileToken } from './turnstile';

const reply = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe('startSession', () => {
  it('sends the bot check token in the header the server reads', async () => {
    vi.mocked(getTurnstileToken).mockResolvedValue('tok-1');
    const fetchMock = vi.fn().mockResolvedValue(reply());
    vi.stubGlobal('fetch', fetchMock);
    await startSession();
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe('/api/session');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'cf-turnstile-response': 'tok-1',
      'content-type': 'application/json',
    });
  });

  it('sends no token header when the site has no bot check', async () => {
    vi.mocked(getTurnstileToken).mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue(reply());
    vi.stubGlobal('fetch', fetchMock);
    await startSession();
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).not.toHaveProperty('cf-turnstile-response');
  });
});
