// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  clearSessionCookie,
  COOKIE_MAX_AGE,
  createSession,
  encodeSession,
  isSecureRequest,
  MAX_SESSION_AGE,
  readCookie,
  readSession,
  serializeSessionCookie,
  sessionFromHeader,
  VERIFIED_FOR,
} from './session';

const SECRET = 'test-secret-not-real';
const NOW = 1_800_000_000;

/** The older cookie value, `<id>.<signature>`, as the first version of the site wrote it. */
async function legacyValue(id: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${id}.${hex}`;
}

describe('the chat cookie value', () => {
  it('holds the chat id, when it began and until when the bot check counts, signed', async () => {
    const { id, value } = await createSession(SECRET, NOW);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(value).toMatch(/^v2\.[0-9a-f]{32}\.\d+\.\d+\.[0-9a-f]{64}$/);
    expect(await readSession(value, SECRET, NOW)).toEqual({
      chatId: id,
      issuedAt: NOW,
      verifiedUntil: NOW + VERIFIED_FOR,
    });
  });

  it('makes a different chat id each time', async () => {
    const a = await createSession(SECRET, NOW);
    const b = await createSession(SECRET, NOW);
    expect(a.id).not.toBe(b.id);
  });

  it('rejects a tampered id, time or signature, and a different secret', async () => {
    const { value } = await createSession(SECRET, NOW);
    const [v, id, issued, until, signature] = value.split('.');
    const flip = (s: string) => s.replace(/.$/, s.endsWith('0') ? '1' : '0');
    for (const bad of [
      [v, flip(id), issued, until, signature],
      [v, id, String(Number(issued) - 1), until, signature],
      // stretching the bot check by a day is the tampering that matters most
      [v, id, issued, String(Number(until) + 86400), signature],
      [v, id, issued, until, flip(signature)],
    ]) {
      expect(await readSession(bad.join('.'), SECRET, NOW)).toBeNull();
    }
    expect(await readSession(value, 'another-secret', NOW)).toBeNull();
  });

  it.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['no signature', 'a'.repeat(32)],
    ['junk', 'not-a-cookie'],
    ['too many parts', `v2.${'a'.repeat(32)}.1.2.${'b'.repeat(64)}.extra`],
    ['non-hex characters', `${'z'.repeat(32)}.${'b'.repeat(64)}`],
    ['a wrong version', `v3.${'a'.repeat(32)}.1.2.${'b'.repeat(64)}`],
    ['non-numeric times', `v2.${'a'.repeat(32)}.soon.later.${'b'.repeat(64)}`],
  ])('treats %s as no cookie', async (_name, value) => {
    expect(await readSession(value, SECRET, NOW)).toBeNull();
  });

  it('still names its chat, but not verified, when it is the older id and signature', async () => {
    const id = 'c'.repeat(32);
    expect(await readSession(await legacyValue(id), SECRET, NOW)).toEqual({
      chatId: id,
      issuedAt: NOW,
      verifiedUntil: 0,
    });
    expect(await readSession(`${id}.${'0'.repeat(64)}`, SECRET, NOW)).toBeNull();
  });

  it('goes on being valid for the longest a session may last, and not a moment more', async () => {
    const { value } = await createSession(SECRET, NOW);
    expect(await readSession(value, SECRET, NOW + MAX_SESSION_AGE)).not.toBeNull();
    expect(await readSession(value, SECRET, NOW + MAX_SESSION_AGE + 1)).toBeNull();
  });

  it('is not valid when it claims to have been issued in the future', async () => {
    const value = await encodeSession(
      { chatId: 'd'.repeat(32), issuedAt: NOW + 3600, verifiedUntil: NOW + 7200 },
      SECRET,
    );
    expect(await readSession(value, SECRET, NOW)).toBeNull();
  });
});

describe('reading the Cookie header', () => {
  it('finds our cookie among others', async () => {
    const { id, value } = await createSession(SECRET, NOW);
    const header = `theme=dark; chat=${value}; other=1`;
    expect(readCookie(header)).toBe(value);
    expect(await sessionFromHeader(header, SECRET, NOW)).toBe(id);
  });

  it('returns null when it is absent', async () => {
    expect(readCookie('theme=dark')).toBeNull();
    expect(readCookie(null)).toBeNull();
    expect(await sessionFromHeader(null, SECRET)).toBeNull();
  });
});

describe('the Set-Cookie line', () => {
  it('is Secure, HttpOnly, SameSite=Lax, site-wide and lasts 90 days from its last use', () => {
    expect(COOKIE_MAX_AGE).toBe(90 * 24 * 60 * 60);
    expect(serializeSessionCookie('abc.def', true)).toBe(
      'chat=abc.def; Path=/; Max-Age=7776000; HttpOnly; SameSite=Lax; Secure',
    );
  });

  it('leaves out Secure when asked, for plain http on this computer', () => {
    expect(serializeSessionCookie('abc.def', false)).not.toContain('Secure');
  });

  it('clears the cookie with Max-Age=0', () => {
    expect(clearSessionCookie(true)).toBe(
      'chat=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
    );
  });

  it('decides Secure from the request address', () => {
    expect(isSecureRequest('https://yashbakshi.com/api/chat')).toBe(true);
    expect(isSecureRequest('http://localhost:8788/api/chat')).toBe(false);
    // a phone on the same Wi-Fi trying the local server
    expect(isSecureRequest('http://192.168.1.158:8788/api/chat')).toBe(false);
    expect(isSecureRequest('http://10.0.0.5:8788/api/chat')).toBe(false);
    expect(isSecureRequest('http://172.20.1.9:8788/api/chat')).toBe(false);
    expect(isSecureRequest('http://100.79.179.12:8788/api/chat')).toBe(false);
    expect(isSecureRequest('http://100.128.0.1/api/chat')).toBe(true);
    // but never a public address, an unusual look-alike, or https
    expect(isSecureRequest('http://8.8.8.8/api/chat')).toBe(true);
    expect(isSecureRequest('http://172.32.0.1/api/chat')).toBe(true);
    expect(isSecureRequest('http://192.168.1.158.evil.test/api/chat')).toBe(true);
    expect(isSecureRequest('https://192.168.1.158/api/chat')).toBe(true);
    expect(isSecureRequest('http://127.0.0.1:8788/api/chat')).toBe(false);
    // plain http anywhere else is still marked Secure, so a misconfigured host fails loudly
    expect(isSecureRequest('http://example.com/api/chat')).toBe(true);
    expect(isSecureRequest('https://localhost:8788/api/chat')).toBe(true);
  });
});
