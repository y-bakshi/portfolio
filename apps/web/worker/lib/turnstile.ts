import type { Env } from '../env';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 3000;

/**
 * Asks Cloudflare whether a Turnstile token is genuine. The visitor's IP is not sent: it is optional
 * for Siteverify and we prefer to share nothing. Any failure, including a slow answer, is a no.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  _request: Request,
  env: Pick<Env, 'TURNSTILE_SECRET' | 'REQUIRE_TURNSTILE'>,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = TIMEOUT_MS,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) {
    // no secret: fine for local work and tests, but never when the site says the check is required
    return env.REQUIRE_TURNSTILE !== 'true';
  }
  if (!token) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(SITEVERIFY, {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    return ((await res.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Finds the token in the `cf-turnstile-response` header or the JSON body's `turnstileToken`. */
async function tokenFrom(request: Request): Promise<string | null> {
  const header = request.headers.get('cf-turnstile-response');
  if (header) return header;
  try {
    // a clone, so the route can still read the body itself
    const body = (await request.clone().json()) as { turnstileToken?: unknown };
    return typeof body.turnstileToken === 'string' ? body.turnstileToken : null;
  } catch {
    return null;
  }
}

/** True when the request carries a valid Turnstile token (or none is required). */
export async function verifyHuman(request: Request, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return verifyTurnstile(null, request, env);
  return verifyTurnstile(await tokenFrom(request), request, env);
}
