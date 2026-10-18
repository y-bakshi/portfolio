import type { Env } from '../env';
import type { Clock } from './clock';

const DAY = 86_400_000;
const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const CACHE_MS = 5 * 60_000;

export type Count = { name: string; count: number };

export type TrafficDay = { day: string; requests: number; pageViews: number; visitors: number };

export type Traffic =
  | {
      ok: true;
      days: number;
      daily: TrafficDay[];
      totals: { requests: number; pageViews: number; visitors: number };
      countries: Count[];
      browsers: Count[];
      /** null when this plan or range does not offer the breakdown */
      pages: Count[] | null;
      referrers: Count[] | null;
    }
  | { ok: false; reason: 'not_set_up' | 'unavailable' };

/** Sends one GraphQL query to Cloudflare. Tests pass their own. */
export type Graphql = (
  query: string,
  variables: Record<string, unknown>,
  token: string,
) => Promise<unknown>;

export const cloudflareGraphql: Graphql = async (query, variables, token) => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const body = (await res.json()) as { data?: unknown; errors?: unknown[] };
  if (body.errors?.length || !body.data) throw new Error('query refused');
  return body.data;
};

const DAILY = `query ($zone: String!, $from: Date!, $to: Date!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    days: httpRequests1dGroups(limit: 100, orderBy: [date_ASC],
      filter: { date_geq: $from, date_leq: $to }) {
      dimensions { date }
      sum { requests pageViews countryMap { clientCountryName requests } browserMap { uaBrowserFamily pageViews } }
      uniq { uniques }
    }
  } }
}`;

// real visitors' page loads only: people, successful, an HTML page, not the API or the owner page
const ADAPTIVE = (dimension: string) => `query ($zone: String!, $from: Time!, $to: Time!) {
  viewer { zones(filter: { zoneTag: $zone }) {
    rows: httpRequestsAdaptiveGroups(limit: 40, orderBy: [count_DESC], filter: {
      datetime_geq: $from, datetime_leq: $to, requestSource: "eyeball",
      edgeResponseStatus: 200, edgeResponseContentTypeName: "html" }) {
      count
      dimensions { ${dimension} }
    }
  } }
}`;

type Zone<T> = { viewer: { zones: T[] } };
type DayRow = {
  dimensions: { date: string };
  sum: {
    requests: number;
    pageViews: number;
    countryMap: { clientCountryName: string; requests: number }[];
    browserMap: { uaBrowserFamily: string; pageViews: number }[];
  };
  uniq: { uniques: number };
};

function top(map: Map<string, number>, n: number): Count[] {
  return [...map]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, n);
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const notOwnerOrApi = (path: string) => !/^\/(api|admin|cdn-cgi)(\/|$)/.test(path);

async function optional<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

/**
 * The site's own traffic, from the numbers Cloudflare already counts for the domain. Nothing is added
 * to the pages. The per-day counts include bots and asset requests, and "visitors" is Cloudflare's
 * estimate of unique visitors, so these are for trends, not for exact audience size.
 */
export async function loadTraffic(
  env: Pick<Env, 'CF_ANALYTICS_TOKEN' | 'CF_ZONE_ID'>,
  days: number,
  clock: Clock,
  graphql: Graphql = cloudflareGraphql,
): Promise<Traffic> {
  const token = env.CF_ANALYTICS_TOKEN;
  const zone = env.CF_ZONE_ID;
  if (!token || !zone) return { ok: false, reason: 'not_set_up' };
  const to = clock();
  const from = to - (days - 1) * DAY;
  try {
    const data = (await graphql(
      DAILY,
      { zone, from: isoDay(from), to: isoDay(to) },
      token,
    )) as Zone<{ days: DayRow[] }>;
    const rows = data.viewer.zones[0]?.days ?? [];
    const byDay = new Map(rows.map((r) => [r.dimensions.date, r]));
    const daily: TrafficDay[] = [];
    const countries = new Map<string, number>();
    const browsers = new Map<string, number>();
    for (let t = from; t <= to; t += DAY) {
      const r = byDay.get(isoDay(t));
      daily.push({
        day: isoDay(t),
        requests: r?.sum.requests ?? 0,
        pageViews: r?.sum.pageViews ?? 0,
        visitors: r?.uniq.uniques ?? 0,
      });
      for (const c of r?.sum.countryMap ?? [])
        countries.set(c.clientCountryName, (countries.get(c.clientCountryName) ?? 0) + c.requests);
      for (const b of r?.sum.browserMap ?? [])
        browsers.set(b.uaBrowserFamily, (browsers.get(b.uaBrowserFamily) ?? 0) + b.pageViews);
    }
    const range = { zone, from: new Date(from).toISOString(), to: new Date(to).toISOString() };
    const breakdown = async (dimension: 'clientRequestPath' | 'clientRefererHost') =>
      optional(async () => {
        const d = (await graphql(ADAPTIVE(dimension), range, token)) as Zone<{
          rows: { count: number; dimensions: Record<string, string> }[];
        }>;
        const out = new Map<string, number>();
        for (const r of d.viewer.zones[0]?.rows ?? []) {
          const name = r.dimensions[dimension] || '(direct)';
          if (dimension === 'clientRequestPath' && !notOwnerOrApi(name)) continue;
          out.set(name, (out.get(name) ?? 0) + r.count);
        }
        return top(out, 15);
      });
    const [pages, referrers] = await Promise.all([
      breakdown('clientRequestPath'),
      breakdown('clientRefererHost'),
    ]);
    const sum = (key: 'requests' | 'pageViews' | 'visitors') =>
      daily.reduce((n, d) => n + d[key], 0);
    return {
      ok: true,
      days,
      daily,
      totals: { requests: sum('requests'), pageViews: sum('pageViews'), visitors: sum('visitors') },
      countries: top(countries, 10),
      browsers: top(browsers, 8),
      pages,
      referrers,
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

const cache = new Map<string, { at: number; value: Traffic }>();

/** The same, kept for five minutes so a refreshed owner page does not ask Cloudflare each time. */
export async function getTraffic(
  env: Pick<Env, 'CF_ANALYTICS_TOKEN' | 'CF_ZONE_ID'>,
  days: number,
  clock: Clock,
  graphql?: Graphql,
): Promise<Traffic> {
  const key = `${env.CF_ZONE_ID}:${days}`;
  const hit = cache.get(key);
  if (hit && clock() - hit.at < CACHE_MS) return hit.value;
  const value = await loadTraffic(env, days, clock, graphql);
  if (value.ok) cache.set(key, { at: clock(), value });
  return value;
}

/** For tests. */
export const clearTrafficCache = () => cache.clear();
