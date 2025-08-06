import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? 'development'
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`)
dotenv.config({ path: envFile })
const hasEnvFile = fs.existsSync(envFile);

if (hasEnvFile) {
  dotenv.config({ path: '.env' })
}

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
  timeout: 60 * 1000, // 60 seconds
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
