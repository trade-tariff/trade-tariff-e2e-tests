import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`);
dotenv.config({ path: envFile });
dotenv.config({ path: ".env" });

// See https://playwright.dev/docs/test-configuration.
const onCI = (process.env.CI ?? "false") === "true";
export default defineConfig({
  globalSetup: "./global-setup.js",
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: onCI,
  retries: onCI ? 2 : 0,
  // GitHub's public ubuntu-24.04 runners have 4 vCPUs. Lower this first if the
  // suite starts failing on service-side throttling rather than real defects.
  workers: onCI ? 4 : undefined,
  // The HTML report is never uploaded from CI, so building it there is wasted
  // work and leaves an unreadable dot-per-test log. list names each test and
  // its duration, which is also what makes slow tests findable.
  reporter: onCI ? "list" : "html",
  use: {
    trace: "off",
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: wafBypassHeaders(),
  },
  timeout: 30 * 1000, // 30 seconds
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
