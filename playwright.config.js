import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? 'development'
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`)
dotenv.config({ path: envFile })

// See https://playwright.dev/docs/test-configuration.
const onCI = (process.env.CI ?? "false") === "true";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: onCI,
  retries: onCI ? 2 : 0,
  workers: onCI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "off",
    baseURL: process.env.BASE_URL,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
