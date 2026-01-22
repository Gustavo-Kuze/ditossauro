import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron e2e tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Maximum time one test can run for */
  timeout: 60 * 1000,

  /* Global timeout for the entire test run (15 minutes) */
  globalTimeout: 15 * 60 * 1000,

  /* Timeout for assertions */
  expect: {
    timeout: 10 * 1000,
  },

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Single worker to avoid multiple Electron instances */
  workers: 10,

  /* Global teardown to clean up Electron processes */
  globalTeardown: './tests/e2e/global-teardown.ts',

  /* Suppress the worker teardown timeout error - this is expected with Electron + native modules */
  reportSlowTests: null,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for different test types */
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.e2e.ts',
      // Increase timeout for teardown to allow process cleanup
      timeout: 60 * 1000,
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results',
});
