import type { Hono } from 'hono';
import type { AppEnv } from '../app';
import type { Deps } from '../deps';
import { deleteChat, listMessages, ownsMessage, setFeedback } from '../lib/chats';
import { ApiError } from '../lib/http';
import {
  clearSessionCookie,
  isSecureRequest,
  newChatId,
  VERIFIED_FOR,
  type Session,
} from '../lib/session';
import { registerAskRoute } from './ask';
import { admit, chatIdOf, openChat, readJsonObject, sessionOf, setSession, track } from './visitor';

/** The chat routes: session, restore, ask, clear and feedback. */
export function registerChatRoutes(app: Hono<AppEnv>, deps: Deps) {
  /**
   * The one place the bot check is made. A visitor whose check is still good keeps it (and their
   * chat); otherwise the check runs, and passing it starts a chat or renews the one they have.
   */
  app.post('/api/session', async (c) => {
    const admitted = await admit(c, deps, 'session', 0);
    try {
      const nowSec = Math.floor(deps.clock() / 1000);
      const existing = await sessionOf(c, deps);
      let verifiedUntil = existing?.verifiedUntil ?? 0;
      if (verifiedUntil <= nowSec) {
        if (!(await deps.verifyHuman(c.req.raw, c.env))) {
          const reason = c.req.header('cf-turnstile-response') ? 'rejected' : 'no_token';
          await track(c, deps, 'check_failed', { reason }, existing?.chatId);
          throw new ApiError(
            403,
            'verification_failed',
            'The quick check did not pass. Please try again.',
          );
        }
        verifiedUntil = nowSec + VERIFIED_FOR;
      }
      const session: Session = {
        chatId: existing?.chatId ?? newChatId(),
        issuedAt: existing?.issuedAt ?? nowSec,
        verifiedUntil,
      };
      await openChat(c, deps, session);
      await setSession(c, session);
    } catch (error) {
      await admitted.release();
      throw error;
    }
    await admitted.settle(0);
    return c.json({ ok: true });
  });

  // a refresh asks for the transcript; a visitor with no chat gets an empty one and no chat is made.
  // Reading it counts as using the cookie, so it renews.
  app.get('/api/chat', async (c) => {
    const session = await sessionOf(c, deps);
    const messages = session ? await listMessages(c.env.DB, session.chatId) : [];
    if (session) await setSession(c, session);
    return c.json({ messages });
  });

  registerAskRoute(app, deps);

  app.delete('/api/chat', async (c) => {
    const chatId = await chatIdOf(c, deps);
    if (chatId) await deleteChat(c.env.DB, chatId);
    c.header('set-cookie', clearSessionCookie(isSecureRequest(c.req.url)), { append: true });
    return c.json({ ok: true });
  });

  app.post('/api/feedback', async (c) => {
    const body = await readJsonObject(c);
    const { messageId, value } = body;
    if (typeof messageId !== 'string' || (value !== 1 && value !== -1)) {
      throw new ApiError(400, 'bad_request', 'Send a message id and a value of 1 or -1.');
    }
    const admitted = await admit(c, deps, 'feedback', 0);
    try {
      const chatId = await chatIdOf(c, deps);
      // a thumb is only for an answer in the visitor's own chat; anything else looks like nothing
      if (!chatId || !(await ownsMessage(c.env.DB, chatId, messageId, 'assistant'))) {
        throw new ApiError(404, 'not_found', 'There is no such answer in your chat.');
      }
      await setFeedback(c.env.DB, messageId, value, deps.clock());
      await track(c, deps, 'feedback', { value }, chatId);
    } catch (error) {
      await admitted.release();
      throw error;
    }
    await admitted.settle(0);
    return c.json({ ok: true });
  });
}
