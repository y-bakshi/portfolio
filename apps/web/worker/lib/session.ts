/**
 * The chat cookie. It names a chat, never a person: there is no login and nothing identifying in it.
 * It carries two separate things, each with its own life:
 *
 *   - which chat this browser's chat is (the id), so a visitor picks up where they left off. It
 *     renews every time the cookie is used, up to an absolute maximum, so a regular visitor never
 *     loses their chat.
 *   - until when the visitor's bot check counts (`verifiedUntil`). A bot check proves little for
 *     long, so it lapses after a day and is asked for again without touching the chat.
 *
 * The value is `v2.<id>.<issued>.<verifiedUntil>.<signature>`, times in seconds. The older
 * `<id>.<signature>` cookie still names its chat but counts as not verified.
 */
export const COOKIE_NAME = 'chat';
/** How long the cookie lives after its last use: ninety days, in seconds. */
export const COOKIE_MAX_AGE = 90 * 24 * 60 * 60;
/** The longest a chat session may go on from when it began, however often it is used. */
export const MAX_SESSION_AGE = 180 * 24 * 60 * 60;
/** How long a passed bot check counts. */
export const VERIFIED_FOR = 24 * 60 * 60;

/** What the cookie says. Times are seconds since 1970. */
export type Session = { chatId: string; issuedAt: number; verifiedUntil: number };

const encoder = new TextEncoder();
const ID_PATTERN = /^[0-9a-f]{32}$/;
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;
const NUMBER_PATTERN = /^\d{1,12}$/;

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

async function sign(text: string, secret: string): Promise<string> {
  const key = await importKey(secret, 'sign');
  return toHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text))));
}

/** The comparison is done by WebCrypto's `verify`, which takes the same time however close the signature is. */
async function signedBy(text: string, signature: string, secret: string): Promise<boolean> {
  const key = await importKey(secret, 'verify');
  return crypto.subtle.verify('HMAC', key, fromHex(signature), encoder.encode(text));
}

/** A fresh random 128-bit chat id, as 32 hex characters. */
export const newChatId = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

/** The cookie value for a session, signed with our secret. */
export async function encodeSession(session: Session, secret: string): Promise<string> {
  const body = `v2.${session.chatId}.${session.issuedAt}.${session.verifiedUntil}`;
  return `${body}.${await sign(body, secret)}`;
}

/** Makes a new chat session, verified from `nowSec`, together with the cookie value that holds it. */
export async function createSession(secret: string, nowSec = Math.floor(Date.now() / 1000)) {
  const session: Session = {
    chatId: newChatId(),
    issuedAt: nowSec,
    verifiedUntil: nowSec + VERIFIED_FOR,
  };
  return { id: session.chatId, session, value: await encodeSession(session, secret) };
}

/**
 * The session in a cookie value, or null when it is missing, malformed, not signed with our secret,
 * issued in the future or older than the longest a session may go on. A bad cookie is treated as no
 * cookie. An older `<id>.<signature>` cookie gives its chat back with no verification.
 */
export async function readSession(
  value: string | null | undefined,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<Session | null> {
  const parts = (value ?? '').split('.');
  if (parts.length === 2) {
    const [id, signature] = parts as [string, string];
    if (!ID_PATTERN.test(id) || !SIGNATURE_PATTERN.test(signature)) return null;
    if (!(await signedBy(id, signature, secret))) return null;
    return { chatId: id, issuedAt: nowSec, verifiedUntil: 0 };
  }
  if (parts.length !== 5 || parts[0] !== 'v2') return null;
  const [, id, issued, until, signature] = parts as [string, string, string, string, string];
  if (
    !ID_PATTERN.test(id) ||
    !NUMBER_PATTERN.test(issued) ||
    !NUMBER_PATTERN.test(until) ||
    !SIGNATURE_PATTERN.test(signature)
  ) {
    return null;
  }
  if (!(await signedBy(`v2.${id}.${issued}.${until}`, signature, secret))) return null;
  const issuedAt = Number(issued);
  if (issuedAt > nowSec + 60 || nowSec - issuedAt > MAX_SESSION_AGE) return null;
  return { chatId: id, issuedAt, verifiedUntil: Number(until) };
}

/** Finds our cookie in a `Cookie` request header and returns its value. */
export function readCookie(header: string | null | undefined, name = COOKIE_NAME) {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/** The session for a request's `Cookie` header, or null when it has no valid chat cookie. */
export const sessionFromCookie = (
  cookieHeader: string | null | undefined,
  secret: string,
  nowSec?: number,
) => readSession(readCookie(cookieHeader), secret, nowSec);

/** The chat id for a request's `Cookie` header, or null when it has no valid chat cookie. */
export const sessionFromHeader = async (
  cookieHeader: string | null | undefined,
  secret: string,
  nowSec?: number,
) => (await sessionFromCookie(cookieHeader, secret, nowSec))?.chatId ?? null;

/** True for this computer and for a home or office network address (192.168.x.x, 10.x.x.x, 172.16-31.x.x) or a Tailscale one. */
function isLocalHost(hostname: string) {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(hostname);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  // 100.64.0.0/10 is the range Tailscale hands out
  return (
    a === 10 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/**
 * Secure everywhere except plain http on this computer or its own network, where the cookie would
 * never be sent. That lets a phone on the same Wi-Fi try the local server; a real site is https.
 */
export function isSecureRequest(url: string) {
  const { protocol, hostname } = new URL(url);
  return !(protocol === 'http:' && isLocalHost(hostname));
}

function attributes(secure: boolean, maxAge: number) {
  return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** The `Set-Cookie` line that stores a signed session value. */
export const serializeSessionCookie = (value: string, secure: boolean) =>
  `${COOKIE_NAME}=${value}; ${attributes(secure, COOKIE_MAX_AGE)}`;

/** The `Set-Cookie` line that removes the cookie. */
export const clearSessionCookie = (secure: boolean) => `${COOKIE_NAME}=; ${attributes(secure, 0)}`;
