/**
 * The chat cookie. It holds a random chat id and a signature, so the id cannot be guessed or
 * edited. It names a chat, never a person: there is no login and nothing identifying in it.
 */
export const COOKIE_NAME = 'chat';
/** Thirty days, in seconds. */
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const encoder = new TextEncoder();
const ID_PATTERN = /^[0-9a-f]{32}$/;
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;

const toHex = (bytes: Uint8Array) =>
  [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

const importKey = (secret: string, usage: 'sign' | 'verify') =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    usage,
  ]);

/** A fresh random 128-bit chat id, as 32 hex characters. */
export const newChatId = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

/** The cookie value for a chat id: `<id>.<signature>`. */
export async function signChatId(id: string, secret: string): Promise<string> {
  const key = await importKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(id));
  return `${id}.${toHex(new Uint8Array(signature))}`;
}

/** Makes a new chat id together with the cookie value that proves it. */
export async function createSession(secret: string) {
  const id = newChatId();
  return { id, value: await signChatId(id, secret) };
}

/**
 * The chat id inside a cookie value, or null when it is missing, malformed or not signed with our
 * secret. A bad cookie is treated as no cookie. The comparison is done by WebCrypto's `verify`,
 * which takes the same time whether or not the signature is close.
 */
export async function verifySession(
  value: string | null | undefined,
  secret: string,
): Promise<string | null> {
  const [id, signature, ...extra] = (value ?? '').split('.');
  if (extra.length > 0 || !ID_PATTERN.test(id ?? '') || !SIGNATURE_PATTERN.test(signature ?? '')) {
    return null;
  }
  const key = await importKey(secret, 'verify');
  const ok = await crypto.subtle.verify('HMAC', key, fromHex(signature), encoder.encode(id));
  return ok ? id : null;
}

/** Finds our cookie in a `Cookie` request header and returns its value. */
export function readCookie(header: string | null | undefined, name = COOKIE_NAME) {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/** The chat id for a request's `Cookie` header, or null when it has no valid chat cookie. */
export const sessionFromHeader = (cookieHeader: string | null | undefined, secret: string) =>
  verifySession(readCookie(cookieHeader), secret);

/** Secure everywhere except plain http on this computer, where the cookie would never be sent. */
export function isSecureRequest(url: string) {
  const { protocol, hostname } = new URL(url);
  const local = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  return !(protocol === 'http:' && local);
}

function attributes(secure: boolean, maxAge: number) {
  return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** The `Set-Cookie` line that stores a signed session value. */
export const serializeSessionCookie = (value: string, secure: boolean) =>
  `${COOKIE_NAME}=${value}; ${attributes(secure, COOKIE_MAX_AGE)}`;

/** The `Set-Cookie` line that removes the cookie. */
export const clearSessionCookie = (secure: boolean) => `${COOKIE_NAME}=; ${attributes(secure, 0)}`;
