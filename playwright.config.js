import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(import.meta.dirname, `.env.${playwrightEnv}`);
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
  // 4 workers on a 4 vCPU runner is slower than 2, not faster: each worker
  // drives its own Chromium, and the contention inflated total test time from
  // ~44s to 62s and wall clock from 22.1s to 30.1s (run 34484210292). Measure
  // before raising this.
  workers: onCI ? 2 : undefined,
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
