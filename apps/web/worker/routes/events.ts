import type { Hono } from 'hono';
import type { AppEnv } from '../app';
import { education, roles } from '../../src/content/history';
import { projects } from '../../src/content/projects';
import { systemClock, type Clock } from '../lib/clock';
import { recordEvent } from '../lib/events';
import { ApiError } from '../lib/http';

type Deps = {
  /** The chat id from the chat cookie, if there is one. The cookie itself is another phase's job. */
  getChatId?: (request: Request) => string | null | Promise<string | null>;
  clock?: Clock;
};

/** Every card the guide can point at: projects, roles, degrees, and the contact block. */
const SOURCE_IDS = new Set<string>([
  ...projects.map((p) => p.id),
  ...roles.map((r) => r.id),
  ...education.map((e) => e.id),
  'contact',
]);

/**
 * `POST /api/events`: the few events only the browser knows about. For now just `cite_clicked`
 * (a "Show on the page" button was pressed). The body is checked against the content registry, so
 * nothing a visitor types ever reaches the events table.
 */
export function registerEventRoutes(app: Hono<AppEnv>, deps: Deps = {}) {
  const clock = deps.clock ?? systemClock;
  const getChatId = deps.getChatId ?? (() => null);

  app.post('/api/events', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      throw new ApiError(400, 'bad_request', 'That request could not be read.');
    }
    const { type, sourceId } = (body ?? {}) as Record<string, unknown>;
    if (type !== 'cite_clicked' || typeof sourceId !== 'string' || !SOURCE_IDS.has(sourceId)) {
      throw new ApiError(400, 'bad_request', 'That event is not one the site records.');
    }
    // recordEvent never throws, so a database hiccup does not turn into an error for the visitor
    await recordEvent(c.env.DB, clock, {
      type: 'cite_clicked',
      chatId: await getChatId(c.req.raw),
      data: { sourceId },
    });
    return c.body(null, 204);
  });
}
