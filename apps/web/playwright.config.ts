import { defineConfig, devices } from '@playwright/test';

const port = 5199;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      // the phone-only checks do not apply to a wide screen
      testIgnore: /panel-phone\.spec\.ts/,
    },
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
      // the desktop-only checks do not apply to a phone
      testIgnore: /panel-wide\.spec\.ts/,
    },
  ],
});
