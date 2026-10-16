import type { Env } from '../env';
import type { Clock } from './clock';
import { utcDay } from './period';

const encoder = new TextEncoder();

async function hmacHex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Today's salt. It changes at midnight UTC, so a key cannot be followed from one day to the next. */
async function dailySalt(env: Env, clock: Clock): Promise<string> {
  if (!env.HMAC_SECRET) throw new Error('HMAC_SECRET is not set');
  return hmacHex(env.HMAC_SECRET, `salt:${utcDay(clock())}`);
}

/**
 * Who is calling, as far as limits need to know, without keeping the IP address: a keyed hash of
 * the IP and today's salt. The address itself is never returned, stored or logged.
 */
export async function networkKey(request: Request, env: Env, clock: Clock): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  return hmacHex(await dailySalt(env, clock), `net:${ip}`);
}

/** The same idea for one chat, so each chat can have its own limit. Also changes every day. */
export async function visitorKey(chatId: string, env: Env, clock: Clock): Promise<string> {
  return hmacHex(await dailySalt(env, clock), `visitor:${chatId}`);
}
