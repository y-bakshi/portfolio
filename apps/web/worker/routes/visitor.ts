import type { Context } from 'hono';
import type { AppEnv } from '../app';
import type { Deps } from '../deps';
import type { Admitted, AdmissionKind } from '../lib/admission';
import { chatExists, createChat, touchChat } from '../lib/chats';
import { recordEvent, type EventType } from '../lib/events';
import { ApiError } from '../lib/http';
import {
  createSession,
  isSecureRequest,
  serializeSessionCookie,
  sessionFromHeader,
} from '../lib/session';

export type Ctx = Context<AppEnv>;

function secretOf(c: Ctx): string {
  const secret = c.env.SESSION_SECRET;
  // without a secret every cookie would be forgeable, so refuse to run rather than guess
  if (!secret) throw new ApiError(503, 'unavailable', 'Chat is not set up on this server.');
  return secret;
}

/** The id of this visitor's chat, or null when they have no valid cookie. */
export const chatIdOf = (c: Ctx) => sessionFromHeader(c.req.header('cookie'), secretOf(c));

/**
 * The visitor's chat id. A visitor with no valid cookie gets a new chat and the cookie that names
 * it. A valid cookie whose chat was deleted (for example by retention) gets the chat back.
 */
export async function ensureChat(c: Ctx, deps: Deps): Promise<string> {
  const now = deps.clock();
  const known = await chatIdOf(c);
  if (known) {
    if (await chatExists(c.env.DB, known)) await touchChat(c.env.DB, known, now);
    else await createChat(c.env.DB, known, now);
    return known;
  }
  // a new visitor has to pass the bot check, whichever route they arrive by: a one-use token cannot
  // be checked twice, so it is checked here and nowhere else, and a valid cookie shows it was passed
  if (!(await deps.verifyHuman(c.req.raw, c.env))) {
    throw new ApiError(403, 'forbidden', 'The check that you are a person did not pass.');
  }
  const { id, value } = await createSession(secretOf(c));
  await createChat(c.env.DB, id, now);
  c.header('set-cookie', serializeSessionCookie(value, isSecureRequest(c.req.url)), {
    append: true,
  });
  return id;
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
