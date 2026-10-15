// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  clearSessionCookie,
  createSession,
  isSecureRequest,
  readCookie,
  serializeSessionCookie,
  sessionFromHeader,
  signChatId,
  verifySession,
} from './session';

const SECRET = 'test-secret-not-real';

describe('the chat cookie value', () => {
  it('is a 128-bit hex id and a signature, and verifies back to the id', async () => {
    const { id, value } = await createSession(SECRET);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(value).toMatch(/^[0-9a-f]{32}\.[0-9a-f]{64}$/);
    expect(await verifySession(value, SECRET)).toBe(id);
  });

  it('makes a different id each time', async () => {
    const a = await createSession(SECRET);
    const b = await createSession(SECRET);
    expect(a.id).not.toBe(b.id);
  });

  it('signs the same id the same way', async () => {
    expect(await signChatId('a'.repeat(32), SECRET)).toBe(await signChatId('a'.repeat(32), SECRET));
  });

  it('rejects a tampered id, a tampered signature and a different secret', async () => {
    const { id, value } = await createSession(SECRET);
    const [, signature] = value.split('.');
    const otherId = id.replace(/.$/, id.endsWith('0') ? '1' : '0');
    expect(await verifySession(`${otherId}.${signature}`, SECRET)).toBeNull();
    const flipped = signature.replace(/.$/, signature.endsWith('0') ? '1' : '0');
    expect(await verifySession(`${id}.${flipped}`, SECRET)).toBeNull();
    expect(await verifySession(value, 'another-secret')).toBeNull();
  });

  it.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['no signature', 'a'.repeat(32)],
    ['junk', 'not-a-cookie'],
    ['too many parts', `${'a'.repeat(32)}.${'b'.repeat(64)}.extra`],
    ['non-hex characters', `${'z'.repeat(32)}.${'b'.repeat(64)}`],
  ])('treats %s as no cookie', async (_name, value) => {
    expect(await verifySession(value, SECRET)).toBeNull();
  });
});

describe('reading the Cookie header', () => {
  it('finds our cookie among others', async () => {
    const { id, value } = await createSession(SECRET);
    const header = `theme=dark; chat=${value}; other=1`;
    expect(readCookie(header)).toBe(value);
    expect(await sessionFromHeader(header, SECRET)).toBe(id);
  });

  it('returns null when it is absent', async () => {
    expect(readCookie('theme=dark')).toBeNull();
    expect(readCookie(null)).toBeNull();
    expect(await sessionFromHeader(null, SECRET)).toBeNull();
  });
});

describe('the Set-Cookie line', () => {
  it('is Secure, HttpOnly, SameSite=Lax, site-wide and lasts 30 days', () => {
    const line = serializeSessionCookie('abc.def', true);
    expect(line).toBe('chat=abc.def; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure');
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
    expect(isSecureRequest('http://127.0.0.1:8788/api/chat')).toBe(false);
    // plain http anywhere else is still marked Secure, so a misconfigured host fails loudly
    expect(isSecureRequest('http://example.com/api/chat')).toBe(true);
    expect(isSecureRequest('https://localhost:8788/api/chat')).toBe(true);
  });
});
