import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:4173'

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /video\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /video\.spec/ },
    // Playwright's bundled Chromium has no H.264 decoder, so the scrub test runs in branded Chrome.
    { name: 'chrome-video', use: { ...devices['Desktop Chrome'], channel: 'chrome' }, testMatch: /video\.spec/ },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
