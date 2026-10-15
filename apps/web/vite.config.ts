import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { sitePlugin } from './vite.site';

export default defineConfig({
  plugins: [react(), sitePlugin()],
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
