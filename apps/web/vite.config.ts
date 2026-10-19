import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { prerenderPlugin } from './vite.prerender';
import { sitePlugin } from './vite.site';

export default defineConfig({
  plugins: [react(), tailwindcss(), sitePlugin(), prerenderPlugin()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // every page is its own HTML file, so there is no single-page fallback
  appType: 'mpa',
  server: {
    // in development the chat talks to the local Worker (npm run worker:dev, port 8788); the Worker only accepts
    // requests from its own address, so the proxy says they come from there
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => req.setHeader('origin', 'http://localhost:8788'));
        },
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        projects: 'projects/index.html',
        contact: 'contact/index.html',
        testpilot: 'projects/testpilot/index.html',
        chat: 'chat/index.html',
        privacy: 'privacy/index.html',
        notfound: '404.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'worker/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
