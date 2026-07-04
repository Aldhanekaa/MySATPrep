import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for end-to-end tests.
 *
 * Tests live in the `e2e/` directory by convention.
 * The dev server is started automatically before the test run.
 *
 * See: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  // Run all tests in each file in parallel
  fullyParallel: true,
  // Fail the build on CI if any test was accidentally left as test.only
  forbidOnly: !!process.env.CI,
  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,
  // Single worker on CI to reduce flakiness
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    // Base URL used in `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    // Collect trace on retry
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  // Start the Next.js dev server before running tests
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
