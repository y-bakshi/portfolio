import { createApp } from './app';
import { registerAdminRoutes } from './routes/admin';
import { registerEventRoutes } from './routes/events';

const app = createApp();
registerAdminRoutes(app);
registerEventRoutes(app);

// a Hono app is itself a Worker: Cloudflare calls its fetch for every request it is routed
export default app;
