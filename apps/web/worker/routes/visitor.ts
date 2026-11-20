import type { Context } from 'hono';
import type { AppEnv } from '../app';
import type { Deps } from '../deps';
import type { Admitted, AdmissionKind } from '../lib/admission';
import { chatExists, createChat, touchChat } from '../lib/chats';
import { recordEvent, type EventType } from '../lib/events';
import { ApiError } from '../lib/http';
import {
  encodeSession,
  isSecureRequest,
  serializeSessionCookie,
  sessionFromCookie,
  type Session,
} from '../lib/session';

export type Ctx = Context<AppEnv>;

function secretOf(c: Ctx): string {
  const secret = c.env.SESSION_SECRET;
  // without a secret every cookie would be forgeable, so refuse to run rather than guess
  if (!secret) throw new ApiError(503, 'unavailable', 'Chat is not set up on this server.');
  return secret;
}

/** This visitor's session, or null when they have no valid chat cookie. */
export const sessionOf = (c: Ctx, deps: Deps) =>
  sessionFromCookie(c.req.header('cookie'), secretOf(c), Math.floor(deps.clock() / 1000));

/** The id of this visitor's chat, or null when they have no valid cookie. */
export async function chatIdOf(c: Ctx, deps: Deps) {
  return (await sessionOf(c, deps))?.chatId ?? null;
}

/** Writes the session into the cookie, which also starts its life over (it renews each time it is used). */
export async function setSession(c: Ctx, session: Session) {
  const value = await encodeSession(session, secretOf(c));
  c.header('set-cookie', serializeSessionCookie(value, isSecureRequest(c.req.url)), {
    append: true,
  });
}

/** Makes sure the chat the session names exists (a retention sweep may have removed it) and marks it used. */
export async function openChat(c: Ctx, deps: Deps, session: Session): Promise<string> {
  const now = deps.clock();
  if (await chatExists(c.env.DB, session.chatId)) await touchChat(c.env.DB, session.chatId, now);
  else await createChat(c.env.DB, session.chatId, now);
  return session.chatId;
}

/**
 * For a question: the visitor's session, when it names a chat and a bot check passed within the last
 * day. Otherwise a refusal with a code the page acts on: it runs the check and asks again. The chat
 * is not touched here, so a refused request costs nothing.
 */
export async function verifiedSession(c: Ctx, deps: Deps): Promise<Session> {
  const session = await sessionOf(c, deps);
  const nowSec = Math.floor(deps.clock() / 1000);
  if (session && session.verifiedUntil > nowSec) return session;
  await track(
    c,
    deps,
    'check_needed',
    { reason: session ? 'lapsed' : 'no_cookie' },
    session?.chatId,
  );
  throw new ApiError(
    403,
    'verification_required',
    'Please complete the quick check to confirm you are a person, then ask again.',
  );
}

/** Asks admission for permission, and throws its refusal as the API error. */
export async function admit(
  c: Ctx,
  deps: Deps,
  kind: AdmissionKind,
  maxCostMicroUsd: number,
): Promise<Admitted> {
  const outcome = await deps.admission.admit(c.req.raw, c.env, { kind, maxCostMicroUsd });
  if (!outcome.ok) {
    // the scope is which limit was hit, or the budget when the spending cap or kill switch was
    const scope = outcome.error.code === 'rate_limited' ? kind : 'budget';
    await track(c, deps, 'rate_limited', { scope });
    throw outcome.error;
  }
  return outcome;
}

/** Records a usage event for the owner's view. It never throws, so it can never fail a request. */
export function track(
  c: Ctx,
  deps: Deps,
  type: EventType,
  data?: Record<string, unknown>,
  chatId?: string | null,
) {
  return recordEvent(c.env.DB, deps.clock, { type, chatId: chatId ?? null, data });
}

/** The JSON object in the request body, or a 400. */
export async function readJsonObject(c: Ctx): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, 'bad_request', 'The request body must be JSON.');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ApiError(400, 'bad_request', 'The request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}
