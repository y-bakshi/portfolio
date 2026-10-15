// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';
import { networkKey, visitorKey } from './identity';

const env = { HMAC_SECRET: 'test-secret' } as Env;
const DAY1 = Date.UTC(2026, 9, 14, 12);
const DAY2 = Date.UTC(2026, 9, 15, 12);
const from = (ip?: string) =>
  new Request('https://x.test/', ip ? { headers: { 'CF-Connecting-IP': ip } } : {});

describe('network identity', () => {
  it('is stable within a day and differs across days and addresses', async () => {
    const a = await networkKey(from('203.0.113.7'), env, () => DAY1);
    expect(await networkKey(from('203.0.113.7'), env, () => DAY1 + 3_600_000)).toBe(a);
    expect(await networkKey(from('203.0.113.7'), env, () => DAY2)).not.toBe(a);
    expect(await networkKey(from('203.0.113.8'), env, () => DAY1)).not.toBe(a);
  });

  it('is a hex hash that never contains the address', async () => {
    const key = await networkKey(from('203.0.113.7'), env, () => DAY1);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('203');
  });

  it('uses one shared key when the address is missing', async () => {
    expect(await networkKey(from(), env, () => DAY1)).toBe(
      await networkKey(from(), env, () => DAY1),
    );
  });

  it('depends on the secret, and refuses to work without one', async () => {
    const other = await networkKey(from('1.2.3.4'), { HMAC_SECRET: 'other' } as Env, () => DAY1);
    expect(other).not.toBe(await networkKey(from('1.2.3.4'), env, () => DAY1));
    await expect(networkKey(from('1.2.3.4'), {} as Env, () => DAY1)).rejects.toThrow();
  });

  it('gives each chat its own daily key', async () => {
    const a = await visitorKey('chat-1', env, () => DAY1);
    expect(await visitorKey('chat-2', env, () => DAY1)).not.toBe(a);
    expect(await visitorKey('chat-1', env, () => DAY2)).not.toBe(a);
  });
});
