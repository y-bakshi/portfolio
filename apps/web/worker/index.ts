import type { ExportedHandler } from '@cloudflare/workers-types';
import { buildApp } from './build';
import type { Env } from './env';
import { systemClock } from './lib/clock';
import { runRetention } from './lib/retention';

export { Guard } from './do/guard';

// the app is built once per set of bindings, not once per request
const apps = new WeakMap<Env, ReturnType<typeof buildApp>>();

function appFor(env: Env) {
  let app = apps.get(env);
  if (!app) apps.set(env, (app = buildApp(env)));
  return app;
}

// the Worker answers requests under /api and /admin and, once a day, clears out data past its retention period
export default {
  // Hono works with the standard Request and Response; Cloudflare's types differ only in extras
  fetch: ((request: Request, env: Env, ctx: unknown) =>
    appFor(env).fetch(request, env, ctx as never)) as unknown as ExportedHandler<Env>['fetch'],
  async scheduled(_controller, env) {
    const counts = await runRetention(env.DB, systemClock);
    console.log('retention', JSON.stringify(counts));
  },
} satisfies ExportedHandler<Env>;
