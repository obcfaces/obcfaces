import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Production-ready setup for smoke tests
 * 
 * Environment Variables:
 * - BASE_URL: Target URL for tests (default: http://localhost:4173)
 * - TURNSTILE_SITE_KEY: Turnstile site key for testing
 * - TURNSTILE_SECRET: Turnstile secret for verification
 * - DEFAULT_LOCALE: Default locale for tests (default: en-ph)
 */

const baseURL = process.env.BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env.CI ? [['github' as const]] : []),
  ],
  
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    
    // Inject environment variables for tests
    extraHTTPHeaders: process.env.CI ? {
      'X-Test-Mode': 'true',
    } : {},
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'iphone-12',
      use: { 
        ...devices['iPhone 12'],
        // Mobile-specific settings
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
