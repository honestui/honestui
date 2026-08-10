import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const providedBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = providedBaseURL ?? "http://127.0.0.1:" + port;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: providedBaseURL
    ? undefined
    : {
        command: process.env.CI
          ? "npm run start -- --hostname 127.0.0.1 --port " + port
          : "npm run dev -- --hostname 127.0.0.1 --port " + port,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
});
