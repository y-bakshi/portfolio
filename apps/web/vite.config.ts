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
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        projects: 'projects/index.html',
        testpilot: 'projects/testpilot/index.html',
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
