import { defineConfig, devices } from '@playwright/test';

// End-to-end and visual regression tests. Tests live in e2e/, separate from unit tests (the unit test runner excludes this directory).
// The screenshot tolerance counts pixels: a ratio would let a small button that changed color slip within tolerance.
// The port comes from E2E_PORT, so runs in different worktrees can use different free ports side by side; {{default port}} applies when it is not set.
// Replace {{start command}} with a command that builds and then starts a preview server on `port`, written as a template string,
// e.g. for Vite: `npm run build && npx vite preview --port ${port} --strictPort`
const port = Number(process.env.E2E_PORT ?? {{default port}});

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'on-first-retry' },
  expect: { toHaveScreenshot: { maxDiffPixels: 20, animations: 'disabled' } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `{{start command}}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
