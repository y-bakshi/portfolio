import { createApp } from './app';
import type { Deps } from './deps';
import type { Env } from './env';
import { createAdmission } from './lib/protect';
import { sessionFromHeader } from './lib/session';
import { verifyHuman } from './lib/turnstile';
import { suggestions } from '../src/content';
import { cachedAnswerer } from './lib/answer-cache';
import { systemClock } from './lib/clock';
import { createAnswerer } from './rag/create';
import { answerVersion } from './rag/version';
import { registerAdminRoutes } from './routes/admin';
import { registerEventRoutes } from './routes/events';

/**
 * The whole API with the real pieces plugged in: the rate limits and spending cap, the bot check,
 * the model-backed answerer (or one that says it cannot answer when no model is set up), the owner's view and
 * the browser events. Tests pass `overrides` to swap one piece for a fake.
 */
export function buildApp(env: Env, overrides: Partial<Deps> = {}) {
  const app = createApp({
    admission: createAdmission(),
    // the suggestion buttons ask the same few questions again and again, so their answers are kept
    answerer: cachedAnswerer(createAnswerer(env), {
      db: env.DB,
      clock: systemClock,
      version: answerVersion(env),
      questions: suggestions,
    }),
    verifyHuman,
    ...overrides,
  });
  registerAdminRoutes(app);
  registerEventRoutes(app, {
    // a browser event belongs to the chat named by the cookie, when there is one
    getChatId: (request) =>
      env.SESSION_SECRET
        ? sessionFromHeader(request.headers.get('cookie'), env.SESSION_SECRET)
        : null,
  });
  return app;
}
