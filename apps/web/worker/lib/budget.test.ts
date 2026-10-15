// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as b from './budget';
import { memoryStorage } from './storage';

const caps = { month: 1_000_000, day: 300_000 };
const T0 = Date.UTC(2026, 9, 14, 10);

async function held(s = memoryStorage(), now = T0, amount = 100_000) {
  const r = await b.reserve(s, now, caps, amount);
  if (!r.ok) throw new Error('expected a reservation');
  return { s, id: r.id };
}

describe('budget', () => {
  it('reserves until the day cap, then refuses until tomorrow', async () => {
    const s = memoryStorage();
    for (let i = 0; i < 3; i++) await held(s);
    expect(await b.reserve(s, T0, caps, 100_000)).toEqual({
      ok: false,
      reason: 'day',
      retryAtMs: Date.UTC(2026, 9, 15),
    });
  });

  it('settling frees the unused part', async () => {
    const { s, id } = await held(memoryStorage(), T0, 200_000);
    await b.settle(s, T0, id, 20_000);
    expect((await b.reserve(s, T0, caps, 280_000)).ok).toBe(true);
    expect((await b.reserve(s, T0, caps, 1)).ok).toBe(false);
  });

  it('releasing gives everything back', async () => {
    const { s, id } = await held(memoryStorage(), T0, 300_000);
    await b.release(s, T0, id);
    expect((await b.reserve(s, T0, caps, 300_000)).ok).toBe(true);
  });

  it('keeps a reservation nobody settled, counted at its reserved amount', async () => {
    const { s, id } = await held(memoryStorage(), T0, 300_000);
    const later = T0 + b.RESERVATION_TIMEOUT_MS + 1;
    // too late to release or settle: the money stays counted
    await b.release(s, later, id);
    expect((await b.reserve(s, later, caps, 1)).ok).toBe(false);
    await b.settle(s, later, id, 0);
    expect((await b.reserve(s, later, caps, 1)).ok).toBe(false);
  });

  it('counts a pending reservation before the timeout', async () => {
    const { s } = await held(memoryStorage(), T0, 300_000);
    expect((await b.reserve(s, T0 + 60_000, caps, 1)).ok).toBe(false);
  });

  it('refuses everything while the kill switch is on', async () => {
    const s = memoryStorage();
    await b.setKilled(s, true);
    const r = await b.reserve(s, T0, caps, 1);
    expect(r).toMatchObject({ ok: false, reason: 'killed' });
    await b.setKilled(s, false);
    expect((await b.reserve(s, T0, caps, 1)).ok).toBe(true);
  });

  it('refuses at the month cap and resets next month', async () => {
    const s = memoryStorage();
    const tight = { month: 500_000, day: 500_000 };
    const r = await b.reserve(s, T0, tight, 500_000);
    if (!r.ok) throw new Error('expected a reservation');
    await b.settle(s, T0, r.id, 500_000);
    const next = Date.UTC(2026, 9, 15);
    expect(await b.reserve(s, next, tight, 1)).toEqual({
      ok: false,
      reason: 'month',
      retryAtMs: Date.UTC(2026, 10, 1),
    });
    expect((await b.reserve(s, Date.UTC(2026, 10, 1), tight, 1)).ok).toBe(true);
  });

  it('starts a new day with a fresh day allowance', async () => {
    const { s, id } = await held(memoryStorage(), T0, 300_000);
    await b.settle(s, T0, id, 300_000);
    expect((await b.reserve(s, Date.UTC(2026, 9, 15), caps, 300_000)).ok).toBe(true);
  });

  it('reads caps from the environment with safe fallbacks', () => {
    expect(b.capsFrom({})).toEqual({ month: 5_000_000, day: 500_000 });
    expect(b.capsFrom({ BUDGET_MONTH_MICRO_USD: '2000000', BUDGET_DAY_MICRO_USD: '9' })).toEqual({
      month: 2_000_000,
      day: 9,
    });
    expect(b.capsFrom({ BUDGET_MONTH_MICRO_USD: 'lots', BUDGET_DAY_MICRO_USD: '-4' })).toEqual({
      month: 5_000_000,
      day: 500_000,
    });
  });
});
