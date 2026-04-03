import { defineConfig, devices } from '@playwright/test';

/**
 * Local: builds and serves `vite preview` on 4173 (avoids clashing with `npm run dev` on 5174).
 * Remote / staging: `PLAYWRIGHT_BASE_URL=https://your-deploy.example.com npm run test:e2e`
 *   — no local server; tests hit the remote origin only.
 */
const remoteBase = process.env.PLAYWRIGHT_BASE_URL?.trim();
const localPreview = 'http://localhost:4173';
const baseURL = remoteBase || localPreview;
const useRemote = Boolean(remoteBase);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: useRemote
    ? undefined
    : {
        command: 'npm run build && vite preview --port 4173 --strictPort',
        url: localPreview,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
