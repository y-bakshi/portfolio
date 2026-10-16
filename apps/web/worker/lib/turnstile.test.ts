// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';
import { verifyHuman, verifyTurnstile } from './turnstile';

const req = new Request('https://x.test/api/session', { method: 'POST' });
const withSecret = { TURNSTILE_SECRET: 'sec' };

function reply(body: unknown, status = 200) {
  const calls: { url: string; body: URLSearchParams }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: init.body as URLSearchParams });
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('verifyTurnstile', () => {
  it('accepts a token Cloudflare approves, without sending the IP', async () => {
    const { impl, calls } = reply({ success: true });
    const r = new Request('https://x.test/', { headers: { 'CF-Connecting-IP': '203.0.113.7' } });
    expect(await verifyTurnstile('tok', r, withSecret, impl)).toBe(true);
    expect(calls[0].url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(Object.fromEntries(calls[0].body)).toEqual({ secret: 'sec', response: 'tok' });
  });

  it('refuses a token Cloudflare rejects, an error status or bad output', async () => {
    expect(await verifyTurnstile('t', req, withSecret, reply({ success: false }).impl)).toBe(false);
    expect(await verifyTurnstile('t', req, withSecret, reply({}, 500).impl)).toBe(false);
    expect(await verifyTurnstile('t', req, withSecret, reply('nope').impl)).toBe(false);
  });

  it('refuses a missing token without calling Cloudflare', async () => {
    const { impl, calls } = reply({ success: true });
    expect(await verifyTurnstile(null, req, withSecret, impl)).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('refuses when Cloudflare is too slow', async () => {
    const hang = ((_u: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })) as unknown as typeof fetch;
    expect(await verifyTurnstile('t', req, withSecret, hang, 20)).toBe(false);
  });

  it('without a secret, allows only when the check is not required', async () => {
    expect(await verifyTurnstile(null, req, {})).toBe(true);
    expect(await verifyTurnstile(null, req, { REQUIRE_TURNSTILE: 'false' })).toBe(true);
    expect(await verifyTurnstile(null, req, { REQUIRE_TURNSTILE: 'true' })).toBe(false);
  });
});

describe('verifyHuman', () => {
  const ok = reply({ success: true });
  const run = (r: Request, env: Partial<Env>) => {
    const original = globalThis.fetch;
    globalThis.fetch = ok.impl;
    return verifyHuman(r, env as Env).finally(() => (globalThis.fetch = original));
  };

  it('reads the token from the header', async () => {
    const r = new Request('https://x.test/', { headers: { 'cf-turnstile-response': 'h' } });
    expect(await run(r, withSecret)).toBe(true);
    expect(ok.calls.at(-1)?.body.get('response')).toBe('h');
  });

  it('reads the token from the JSON body and leaves the body readable', async () => {
    const r = new Request('https://x.test/', {
      method: 'POST',
      body: JSON.stringify({ message: 'hi', turnstileToken: 'b' }),
    });
    expect(await run(r, withSecret)).toBe(true);
    expect(ok.calls.at(-1)?.body.get('response')).toBe('b');
    expect(((await r.json()) as { message: string }).message).toBe('hi');
  });

  it('refuses when a secret is set but no token is given', async () => {
    expect(
      await run(new Request('https://x.test/', { method: 'POST', body: '{}' }), withSecret),
    ).toBe(false);
  });

  it('follows the required flag when there is no secret', async () => {
    expect(await run(req, {})).toBe(true);
    expect(await run(req, { REQUIRE_TURNSTILE: 'true' })).toBe(false);
  });
});
