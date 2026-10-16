// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MAX_BODY_BYTES } from '../app';
import type { Admission } from '../lib/admission';
import { json, setup, stub } from '../test/harness';

describe('POST /api/chat input and refusals', () => {
  it.each([
    ['empty', { message: '' }],
    ['blank', { message: '   ' }],
    ['not a string', { message: 5 }],
    ['missing', {}],
    ['too long', { message: 'x'.repeat(1001) }],
  ])('rejects a %s message with 400 bad_request', async (_n, body) => {
    const { post, rows } = setup();
    const res = await post('/api/chat', body);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('bad_request');
    expect((await rows('chats')).results).toHaveLength(0);
  });

  it('accepts exactly 1,000 characters after trimming', async () => {
    const { ask } = setup({ answerer: stub('ok') });
    expect((await ask(`  ${'x'.repeat(1000)}  `)).status).toBe(200);
  });

  it('rejects a body that is not JSON', async () => {
    const { call } = setup();
    const res = await call('/api/chat', { method: 'POST', headers: json, body: 'nope' });
    expect(res.status).toBe(400);
  });

  it('rejects an oversize body with 413', async () => {
    const { ask } = setup();
    const res = await ask('x'.repeat(MAX_BODY_BYTES + 10));
    expect(res.status).toBe(413);
  });

  it('refuses a request from another origin', async () => {
    const { call } = setup();
    const res = await call('/api/chat', {
      method: 'POST',
      headers: { ...json, origin: 'https://evil.example' },
      body: JSON.stringify({ message: 'hi' }),
    });
    expect(res.status).toBe(403);
  });

  it('returns the refusal from admission before any work, storing nothing', async () => {
    const { ApiError } = await import('../lib/http');
    const admission: Admission = {
      admit: async () => ({ ok: false, error: new ApiError(429, 'rate_limited', 'Too many.') }),
    };
    const { ask, rows } = setup({ admission });
    const res = await ask('hi');
    expect(res.status).toBe(429);
    expect((await rows('messages')).results).toHaveLength(0);
  });
});
