import type { Clock } from './clock';
import { ApiError } from './http';

/** What the check needs from the environment. Missing values make the admin routes refuse. */
export type AccessEnv = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ADMIN_DEV_BYPASS?: string;
};

export type AccessClaims = {
  iss: string;
  aud: string[];
  exp: number;
  email?: string;
  sub?: string;
};

type Jwk = JsonWebKey & { kid?: string };
type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export const ACCESS_HEADER = 'cf-access-jwt-assertion';
const SKEW_SECONDS = 60;
const KEYS_TTL_MS = 60 * 60 * 1000;
/** An unknown key id may mean Cloudflare rotated keys; look again, but not more often than this. */
const REFETCH_MS = 60 * 1000;

const deny = (status: 401 | 403, message: string) => new ApiError(status, 'forbidden', message);

/** Accepts `team` or `team.cloudflareaccess.com` (with or without https://). */
export function teamHost(value: string): string {
  const host = value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  return host.includes('.') ? host : `${host}.cloudflareaccess.com`;
}

function decode(part: string): Uint8Array<ArrayBuffer> {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function decodeJson(part: string): Record<string, unknown> {
  const value: unknown = JSON.parse(new TextDecoder().decode(decode(part)));
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('shape');
  return value as Record<string, unknown>;
}

/** Only requests to the machine itself may skip the check, and only when the flag says so. */
export function isDevBypass(env: AccessEnv, url: string): boolean {
  return env.ADMIN_DEV_BYPASS === 'true' && new URL(url).hostname === 'localhost';
}

/**
 * Builds a verifier for Cloudflare Access tokens. The fetch and the clock are passed in so tests
 * need no network, and the key cache lives in the closure (one per Worker instance in production).
 */
export function createAccessVerifier(deps: { fetch: Fetch; clock: Clock }) {
  let cache: { host: string; keys: Jwk[]; at: number } | null = null;

  async function keysFor(host: string, kid: string): Promise<Jwk | undefined> {
    const now = deps.clock();
    if (cache && cache.host === host && now - cache.at < KEYS_TTL_MS) {
      const hit = cache.keys.find((k) => k.kid === kid);
      // an unknown key may mean Cloudflare rotated keys; look again, but not in a tight loop
      if (hit || now - cache.at < REFETCH_MS) return hit;
    }
    try {
      const res = await deps.fetch(`https://${host}/cdn-cgi/access/certs`);
      if (!res.ok) throw new Error('status');
      const body = (await res.json()) as { keys?: Jwk[] };
      cache = { host, keys: Array.isArray(body.keys) ? body.keys : [], at: now };
    } catch {
      throw new ApiError(503, 'unavailable', 'The sign-in keys could not be loaded.');
    }
    return cache.keys.find((k) => k.kid === kid);
  }

  return async function verify(token: string | null | undefined, env: AccessEnv) {
    if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw deny(403, 'Admin is not set up.');
    if (!token) throw deny(401, 'Sign in through Cloudflare Access.');
    const parts = token.split('.');
    if (parts.length !== 3) throw deny(401, 'That sign-in token is not valid.');

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;
    try {
      header = decodeJson(parts[0]);
      payload = decodeJson(parts[1]);
    } catch {
      throw deny(401, 'That sign-in token is not valid.');
    }
    // only RS256: "none" and anything else is refused before any key is looked at
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
      throw deny(401, 'That sign-in token is not valid.');
    }

    const host = teamHost(env.ACCESS_TEAM_DOMAIN);
    const jwk = await keysFor(host, header.kid);
    if (!jwk) throw deny(401, 'That sign-in token is not valid.');

    let ok = false;
    try {
      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      ok = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        decode(parts[2]),
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
      );
    } catch {
      ok = false;
    }
    if (!ok) throw deny(401, 'That sign-in token is not valid.');

    const now = deps.clock() / 1000;
    if (typeof payload.exp !== 'number' || payload.exp + SKEW_SECONDS < now) {
      throw deny(401, 'That sign-in has expired.');
    }
    if (typeof payload.nbf === 'number' && payload.nbf - SKEW_SECONDS > now) {
      throw deny(401, 'That sign-in is not valid yet.');
    }
    if (payload.iss !== `https://${host}`) throw deny(403, 'That sign-in is for another team.');
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ACCESS_AUD)) throw deny(403, 'That sign-in is for another application.');

    return {
      iss: payload.iss as string,
      aud: aud as string[],
      exp: payload.exp,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    } satisfies AccessClaims;
  };
}
