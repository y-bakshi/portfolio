// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';
import { localGuard } from '../test/local-guard';
import type { Refused } from './admission';
import { createAdmission, retryAfterSeconds } from './protect';

const T0 = Date.UTC(2026, 9, 14, 10, 0, 0);
const env = { HMAC_SECRET: 's' } as Env;

function setup(caps = { month: 5_000_000, day: 500_000 }, extra: Partial<Env> = {}) {
  let now = T0;
  const guard = localGuard(() => now, caps);
  const admission = createAdmission({ clock: () => now, guard: () => guard });
  const request = (chat = 'chat-1', ip = '203.0.113.7') =>
    new Request('https://x.test/api/chat', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': ip, cookie: `chat=${chat}.sig` },
    });
  const admit = (kind: 'chat' | 'session' | 'feedback', req = request(), cost = 10_000) =>
    admission.admit(req, { ...env, ...extra }, { kind, maxCostMicroUsd: cost });
  return { admit, request, guard, advance: (ms: number) => void (now += ms) };
}

describe('createAdmission', () => {
  it('allows six questions a minute, then asks the visitor to wait', async () => {
    const { admit, advance } = setup();
    for (let i = 0; i < 6; i++) expect((await admit('chat')).ok).toBe(true);
    const refused = (await admit('chat')) as Refused;
    expect(refused.ok).toBe(false);
    expect(refused.error.status).toBe(429);
    expect(refused.error.code).toBe('rate_limited');
    expect(refused.error.retryAt).toBe(new Date(T0 + 60_000).toISOString());
    expect(refused.error.message).toContain('contact section are still open');
    expect(retryAfterSeconds(refused.error, T0)).toBe(60);
    advance(60_000);
    expect((await admit('chat')).ok).toBe(true);
  });

  it('counts the network daily limit across different chats', async () => {
    const s = setup({ month: 1e12, day: 1e12 });
    for (let i = 0; i < 150; i++) {
      expect((await s.admit('chat', s.request(`c${i}`))).ok).toBe(true);
    }
    const refused = (await s.admit('chat', s.request('c-new'))) as Refused;
    expect(refused.error.code).toBe('rate_limited');
    expect(refused.error.retryAt).toBe(new Date(Date.UTC(2026, 9, 15)).toISOString());
  });

  it('settles the real cost and frees the rest', async () => {
    const s = setup({ month: 1e12, day: 100_000 });
    const first = await s.admit('chat', s.request('a'), 100_000);
    if (!first.ok) throw new Error('expected admission');
    await first.settle(10_000);
    const second = await s.admit('chat', s.request('b'), 90_000);
    expect(second.ok).toBe(true);
    const third = (await s.admit('chat', s.request('c'), 1)) as Refused;
    expect(third.error.status).toBe(503);
    expect(third.error.code).toBe('unavailable');
    expect(third.error.message).toContain('resting');
  });

  it('release returns the reservation', async () => {
    const s = setup({ month: 1e12, day: 100_000 });
    const first = await s.admit('chat', s.request('a'), 100_000);
    if (!first.ok) throw new Error('expected admission');
    await first.release();
    expect((await s.admit('chat', s.request('b'), 100_000)).ok).toBe(true);
  });

  it('refuses paid requests when the guard kill switch or the env switch is on', async () => {
    const s = setup();
    await s.guard.setKilled(true);
    expect(((await s.admit('chat')) as Refused).error.code).toBe('unavailable');
    expect((await s.admit('feedback')).ok).toBe(true);
    const env2 = setup(undefined, { KILL_SWITCH: 'true' });
    expect(((await env2.admit('chat')) as Refused).error.status).toBe(503);
  });

  it('keeps session and feedback limits separate and free of budget', async () => {
    const s = setup({ month: 0, day: 0 });
    for (let i = 0; i < 10; i++) expect((await s.admit('session')).ok).toBe(true);
    expect(((await s.admit('session')) as Refused).error.status).toBe(429);
    expect((await s.admit('feedback')).ok).toBe(true);
  });

  it('refuses safely when the guard is broken', async () => {
    const broken = createAdmission({
      clock: () => T0,
      guard: () => {
        throw new Error('down');
      },
    });
    const r = (await broken.admit(new Request('https://x.test/'), env, {
      kind: 'chat',
      maxCostMicroUsd: 1,
    })) as Refused;
    expect(r.error.status).toBe(503);
  });
});
