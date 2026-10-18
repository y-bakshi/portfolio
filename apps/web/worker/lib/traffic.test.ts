// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { clearTrafficCache, getTraffic, loadTraffic, type Graphql } from './traffic';

const NOW = Date.UTC(2026, 9, 14, 12);
const env = { CF_ANALYTICS_TOKEN: 't', CF_ZONE_ID: 'z' };

const days = {
  viewer: {
    zones: [
      {
        days: [
          {
            dimensions: { date: '2026-10-13' },
            sum: {
              requests: 100,
              pageViews: 30,
              countryMap: [
                { clientCountryName: 'US', requests: 70 },
                { clientCountryName: 'IN', requests: 30 },
              ],
              browserMap: [{ uaBrowserFamily: 'Chrome', pageViews: 25 }],
            },
            uniq: { uniques: 12 },
          },
        ],
      },
    ],
  },
};

const adaptive = (rows: { count: number; dimensions: Record<string, string> }[]) => ({
  viewer: { zones: [{ rows }] },
});

/** A fake Cloudflare: the daily query answers, and each breakdown can answer or refuse. */
function fake(opts: { pages?: unknown; referrers?: unknown } = {}): Graphql & { calls: number } {
  const fn = (async (query: string) => {
    fn.calls++;
    if (query.includes('httpRequests1dGroups')) return days;
    const which = query.includes('clientRefererHost') ? opts.referrers : opts.pages;
    if (which === undefined) throw new Error('refused');
    return which;
  }) as unknown as Graphql & { calls: number };
  fn.calls = 0;
  return fn;
}

beforeEach(clearTrafficCache);

describe('traffic', () => {
  it('is not set up without a token or a zone, and never asks Cloudflare', async () => {
    const g = fake();
    expect(await loadTraffic({}, 7, () => NOW, g)).toEqual({ ok: false, reason: 'not_set_up' });
    expect(await loadTraffic({ CF_ANALYTICS_TOKEN: 't' }, 7, () => NOW, g)).toMatchObject({
      reason: 'not_set_up',
    });
    expect(g.calls).toBe(0);
  });

  it('fills every day of the range and totals them', async () => {
    const t = await loadTraffic(env, 3, () => NOW, fake());
    if (!t.ok) throw new Error('expected numbers');
    expect(t.daily.map((d) => d.day)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
    expect(t.daily[1]).toEqual({ day: '2026-10-13', requests: 100, pageViews: 30, visitors: 12 });
    expect(t.totals).toEqual({ requests: 100, pageViews: 30, visitors: 12 });
    expect(t.countries[0]).toEqual({ name: 'US', count: 70 });
    expect(t.browsers).toEqual([{ name: 'Chrome', count: 25 }]);
  });

  it('shows a breakdown as unavailable when Cloudflare refuses that query only', async () => {
    const t = await loadTraffic(env, 3, () => NOW, fake());
    if (!t.ok) throw new Error('expected numbers');
    expect(t.pages).toBeNull();
    expect(t.referrers).toBeNull();
  });

  it('lists top pages without the API and owner pages, and names direct visits', async () => {
    const g = fake({
      pages: adaptive([
        { count: 9, dimensions: { clientRequestPath: '/projects/' } },
        { count: 8, dimensions: { clientRequestPath: '/admin' } },
        { count: 7, dimensions: { clientRequestPath: '/api/chat' } },
      ]),
      referrers: adaptive([
        { count: 5, dimensions: { clientRefererHost: '' } },
        { count: 2, dimensions: { clientRefererHost: 'www.linkedin.com' } },
      ]),
    });
    const t = await loadTraffic(env, 3, () => NOW, g);
    if (!t.ok) throw new Error('expected numbers');
    expect(t.pages).toEqual([{ name: '/projects/', count: 9 }]);
    expect(t.referrers).toEqual([
      { name: '(direct)', count: 5 },
      { name: 'www.linkedin.com', count: 2 },
    ]);
  });

  it('reports unavailable, not a crash, when the main query is refused', async () => {
    const g: Graphql = async () => {
      throw new Error('nope');
    };
    expect(await loadTraffic(env, 3, () => NOW, g)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('keeps an answer for five minutes', async () => {
    const g = fake();
    let t = NOW;
    await getTraffic(env, 3, () => t, g);
    const first = g.calls;
    await getTraffic(env, 3, () => t, g);
    expect(g.calls).toBe(first);
    t += 6 * 60_000;
    await getTraffic(env, 3, () => t, g);
    expect(g.calls).toBeGreaterThan(first);
  });
});
