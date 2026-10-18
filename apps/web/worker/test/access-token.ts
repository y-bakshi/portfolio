/** Test helpers: a real RSA keypair, signed Access-style tokens, and a fake certs endpoint. */
const b64url = (bytes: ArrayBuffer | Uint8Array | string) => {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const TEAM = 'owner.cloudflareaccess.com';
export const AUD = 'aud-tag-123';

export async function makeKeys(kid = 'key-1') {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid, alg: 'RS256' };
  return { privateKey: pair.privateKey, jwk };
}

export async function signToken(
  privateKey: CryptoKey,
  claims: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'RS256', kid: 'key-1', typ: 'JWT' },
) {
  const signing = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${b64url(sig)}`;
}

/** Valid claims for `nowMs`; override any field to make a bad token. */
export const goodClaims = (nowMs: number, over: Record<string, unknown> = {}) => ({
  iss: `https://${TEAM}`,
  aud: [AUD],
  email: 'owner@example.com',
  sub: 'user-1',
  iat: Math.floor(nowMs / 1000),
  nbf: Math.floor(nowMs / 1000) - 5,
  exp: Math.floor(nowMs / 1000) + 3600,
  ...over,
});

/** A fetch that serves the given keys and counts how often it was asked. */
export function fakeCerts(keys: object[]) {
  const calls: string[] = [];
  const fetch = async (url: string) => {
    calls.push(url);
    return { ok: true, json: async () => ({ keys }) };
  };
  return { fetch, calls };
}

export const b64 = b64url;
