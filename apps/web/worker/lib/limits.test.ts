// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkLimits, pruneLimits, RULES, type Rule } from './limits';
import { memoryStorage } from './storage';

const burst: Rule = { name: 'burst', limit: 3, windowMs: 60_000 };
const day: Rule = { name: 'day', limit: 5, windowMs: 86_400_000 };
const T0 = Date.UTC(2026, 9, 14, 10, 0, 10);

describe('limits', () => {
  it('allows up to the limit, then refuses until the window ends', async () => {
    const s = memoryStorage();
    for (let i = 0; i < 3; i++) {
      expect(await checkLimits(s, T0, [{ key: 'a', rule: burst }])).toEqual({ allowed: true });
    }
    const refused = await checkLimits(s, T0 + 5_000, [{ key: 'a', rule: burst }]);
    expect(refused).toEqual({ allowed: false, retryAtMs: Date.UTC(2026, 9, 14, 10, 1) });
  });

  it('starts fresh in the next window', async () => {
    const s = memoryStorage();
    for (let i = 0; i < 3; i++) await checkLimits(s, T0, [{ key: 'a', rule: burst }]);
    expect((await checkLimits(s, T0 + 60_000, [{ key: 'a', rule: burst }])).allowed).toBe(true);
  });

  it('keeps keys apart', async () => {
    const s = memoryStorage();
    for (let i = 0; i < 3; i++) await checkLimits(s, T0, [{ key: 'a', rule: burst }]);
    expect((await checkLimits(s, T0, [{ key: 'b', rule: burst }])).allowed).toBe(true);
  });

  it('counts nothing when any rule refuses, and reports the later retry time', async () => {
    const s = memoryStorage();
    const both = [
      { key: 'a', rule: burst },
      { key: 'a', rule: day },
    ];
    for (let i = 0; i < 3; i++) await checkLimits(s, T0, both);
    const refused = await checkLimits(s, T0, both);
    expect(refused).toEqual({ allowed: false, retryAtMs: Date.UTC(2026, 9, 14, 10, 1) });
    // the day counter was not used up by the refused attempt
    const later = T0 + 60_000;
    expect((await checkLimits(s, later, both)).allowed).toBe(true);
    expect((await checkLimits(s, later + 60_000, both)).allowed).toBe(true);
    const out = await checkLimits(s, later + 120_000, both);
    expect(out).toEqual({ allowed: false, retryAtMs: Date.UTC(2026, 9, 15) });
  });

  it('removes counters from finished windows', async () => {
    const s = memoryStorage();
    await checkLimits(s, T0, [{ key: 'a', rule: burst }]);
    await pruneLimits(s, T0 + 3 * 86_400_000);
    expect((await s.list({ prefix: 'lim:' })).size).toBe(0);
  });

  it('has the starting rules from the design', () => {
    const names = Object.fromEntries(
      Object.entries(RULES).map(([k, v]) => [k, v.map((r) => `${r.rule.name}:${r.rule.limit}`)]),
    );
    expect(names.chat).toEqual(['chat-burst:20', 'chat-day:60', 'chat-net-day:150']);
    expect(names.session).toEqual(['session-burst:10']);
    expect(names.feedback).toEqual(['feedback-day:30']);
  });
});
