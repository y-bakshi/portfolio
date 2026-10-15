import { createApp } from './app';

// a Hono app is itself a Worker: Cloudflare calls its fetch for every request under /api
export default createApp();
