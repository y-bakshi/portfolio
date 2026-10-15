import type { Hono } from 'hono';
import type { AppEnv } from '../app';
import type { Deps } from '../deps';
import { deleteChat, listMessages, ownsMessage, setFeedback } from '../lib/chats';
import { ApiError } from '../lib/http';
import { clearSessionCookie, isSecureRequest } from '../lib/session';
import { registerAskRoute } from './ask';
import { admit, chatIdOf, ensureChat, readJsonObject, track } from './visitor';

/** The chat routes: session, restore, ask, clear and feedback. */
export function registerChatRoutes(app: Hono<AppEnv>, deps: Deps) {
  app.post('/api/session', async (c) => {
    if (!(await deps.verifyHuman(c.req.raw, c.env))) {
      throw new ApiError(403, 'forbidden', 'The check that you are a person did not pass.');
    }
    const admitted = await admit(c, deps, 'session', 0);
    try {
      await ensureChat(c, deps);
    } catch (error) {
      await admitted.release();
      throw error;
    }
    await admitted.settle(0);
    return c.json({ ok: true });
  });

  // a refresh asks for the transcript; a visitor with no chat gets an empty one and no chat is made
  app.get('/api/chat', async (c) => {
    const chatId = await chatIdOf(c);
    const messages = chatId ? await listMessages(c.env.DB, chatId) : [];
    return c.json({ messages });
  });

  registerAskRoute(app, deps);

  app.delete('/api/chat', async (c) => {
    const chatId = await chatIdOf(c);
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
      const chatId = await chatIdOf(c);
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
