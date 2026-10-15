import type { ExportedHandler } from '@cloudflare/workers-types';
import { createApp } from './app';
import type { Env } from './env';
import { systemClock } from './lib/clock';
import { runRetention } from './lib/retention';
import { registerAdminRoutes } from './routes/admin';
import { registerEventRoutes } from './routes/events';

export { Guard } from './do/guard';

const app = createApp();
registerAdminRoutes(app);
registerEventRoutes(app);

// the Worker answers requests under /api and /admin and, once a day, clears out data past its retention period
export default {
  fetch: app.fetch as unknown as ExportedHandler<Env>['fetch'],
  async scheduled(_controller, env) {
    const counts = await runRetention(env.DB, systemClock);
    console.log('retention', JSON.stringify(counts));
  },
} satisfies ExportedHandler<Env>;
