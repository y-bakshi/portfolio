// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createAccessVerifier, isDevBypass, teamHost } from './access';
import { ApiError } from './http';
import { AUD, b64, fakeCerts, goodClaims, makeKeys, signToken, TEAM } from '../test/access-token';

const NOW = Date.UTC(2026, 9, 14, 12);
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD };

let keys: Awaited<ReturnType<typeof makeKeys>>;
beforeAll(async () => {
  keys = await makeKeys();
});

function setup(clockMs = NOW) {
  const certs = fakeCerts([keys.jwk]);
  const verify = createAccessVerifier({ fetch: certs.fetch, clock: () => clockMs });
  return { verify, certs };
}

const status = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  return (error as ApiError).status;
};

describe('Cloudflare Access token check', () => {
  it('accepts a valid token and returns its claims', async () => {
    const { verify } = setup();
    const token = await signToken(keys.privateKey, goodClaims(NOW));
    expect(await verify(token, env)).toMatchObject({ email: 'owner@example.com', aud: [AUD] });
  });

  it('accepts an audience given as a single string', async () => {
    const { verify } = setup();
    const token = await signToken(keys.privateKey, goodClaims(NOW, { aud: AUD }));
    expect((await verify(token, env)).aud).toEqual([AUD]);
  });

  it('refuses an expired token, but allows a little clock skew', async () => {
    const { verify } = setup();
    const expired = await signToken(keys.privateKey, goodClaims(NOW, { exp: NOW / 1000 - 600 }));
    expect(await status(verify(expired, env))).toBe(401);
    const justOver = await signToken(keys.privateKey, goodClaims(NOW, { exp: NOW / 1000 - 20 }));
    expect((await verify(justOver, env)).email).toBeDefined();
  });

  it('refuses a token that is not valid yet', async () => {
    const { verify } = setup();
    const early = await signToken(keys.privateKey, goodClaims(NOW, { nbf: NOW / 1000 + 600 }));
    expect(await status(verify(early, env))).toBe(401);
  });

  it('refuses the wrong audience and the wrong issuer', async () => {
    const { verify } = setup();
    const aud = await signToken(keys.privateKey, goodClaims(NOW, { aud: ['other'] }));
    expect(await status(verify(aud, env))).toBe(403);
    const iss = await signToken(
      keys.privateKey,
      goodClaims(NOW, { iss: 'https://evil.cloudflareaccess.com' }),
    );
    expect(await status(verify(iss, env))).toBe(403);
  });

  it('refuses any algorithm other than RS256, including none', async () => {
    const { verify } = setup();
    for (const alg of ['none', 'HS256', 'RS512']) {
      const token = await signToken(keys.privateKey, goodClaims(NOW), { alg, kid: 'key-1' });
      expect(await status(verify(token, env))).toBe(401);
    }
    const unsigned = `${b64(JSON.stringify({ alg: 'none' }))}.${b64(JSON.stringify(goodClaims(NOW)))}.`;
    expect(await status(verify(unsigned, env))).toBe(401);
  });

  it('refuses a key id it does not know', async () => {
    const { verify } = setup();
    const token = await signToken(keys.privateKey, goodClaims(NOW), { alg: 'RS256', kid: 'nope' });
    expect(await status(verify(token, env))).toBe(401);
  });

  it('refuses a token whose payload was changed after signing', async () => {
    const { verify } = setup();
    const token = await signToken(keys.privateKey, goodClaims(NOW));
    const [h, , s] = token.split('.');
    const forged = `${h}.${b64(JSON.stringify(goodClaims(NOW, { email: 'attacker@example.com' })))}.${s}`;
    expect(await status(verify(forged, env))).toBe(401);
  });

  it('refuses a token signed by a different key', async () => {
    const { verify } = setup();
    const other = await makeKeys('key-1');
    const token = await signToken(other.privateKey, goodClaims(NOW));
    expect(await status(verify(token, env))).toBe(401);
  });

  it('refuses a missing or malformed token', async () => {
    const { verify } = setup();
    expect(await status(verify(null, env))).toBe(401);
    expect(await status(verify('not.a.jwt', env))).toBe(401);
    expect(await status(verify('abc', env))).toBe(401);
  });

  it('fails closed when Access is not configured', async () => {
    const { verify, certs } = setup();
    const token = await signToken(keys.privateKey, goodClaims(NOW));
    expect(await status(verify(token, {}))).toBe(403);
    expect(await status(verify(token, { ACCESS_TEAM_DOMAIN: TEAM }))).toBe(403);
    expect(await status(verify(token, { ACCESS_AUD: AUD }))).toBe(403);
    expect(certs.calls).toHaveLength(0);
  });

  it('caches the keys, and looks again when the cache is old', async () => {
    let now = NOW;
    const certs = fakeCerts([keys.jwk]);
    const verify = createAccessVerifier({ fetch: certs.fetch, clock: () => now });
    const token = await signToken(keys.privateKey, goodClaims(NOW, { exp: NOW / 1000 + 86_400 }));
    await verify(token, env);
    await verify(token, env);
    expect(certs.calls).toEqual([`https://${TEAM}/cdn-cgi/access/certs`]);
    now += 2 * 60 * 60 * 1000;
    await verify(token, env);
    expect(certs.calls).toHaveLength(2);
  });

  it('says unavailable, not allowed, when the keys cannot be fetched', async () => {
    const verify = createAccessVerifier({
      fetch: async () => {
        throw new Error('offline');
      },
      clock: () => NOW,
    });
    const token = await signToken(keys.privateKey, goodClaims(NOW));
    expect(await status(verify(token, env))).toBe(503);
  });
});

describe('the local development bypass', () => {
  it('works only when the flag is exactly true and the host is localhost', () => {
    const on = { ADMIN_DEV_BYPASS: 'true' };
    expect(isDevBypass(on, 'http://localhost:8788/admin')).toBe(true);
    expect(isDevBypass(on, 'https://yashbakshi.com/admin')).toBe(false);
    expect(isDevBypass(on, 'https://localhost.evil.com/admin')).toBe(false);
    expect(isDevBypass({ ADMIN_DEV_BYPASS: 'TRUE' }, 'http://localhost/admin')).toBe(false);
    expect(isDevBypass({ ADMIN_DEV_BYPASS: '1' }, 'http://localhost/admin')).toBe(false);
    expect(isDevBypass({}, 'http://localhost/admin')).toBe(false);
  });

  it('accepts the team name in a few spellings', () => {
    expect(teamHost('owner')).toBe(TEAM);
    expect(teamHost('https://Owner.cloudflareaccess.com/')).toBe(TEAM);
  });
});
