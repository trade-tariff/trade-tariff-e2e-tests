import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`);
dotenv.config({ path: envFile });
dotenv.config({ path: ".env" });
dotenv.config({ quiet: true });

// See https://playwright.dev/docs/test-configuration.
const onCI = (process.env.CI ?? "false") === "true";
export default defineConfig({
  globalSetup: "./global-setup.js",
  testDir: "./tests",
  fullyParallel: false, // parallel workers cause timeouts
  forbidOnly: onCI,
  retries: onCI ? 2 : 0,
  workers: onCI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on",
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: wafBypassHeaders(),
  },
  timeout: 50 * 1000, // 50 seconds
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
