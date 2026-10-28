import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";
import { runProject, authFileFor } from "./utils/projectArgs.js";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(import.meta.dirname, `.env.${playwrightEnv}`);
const desktopChrome = devices["Desktop Chrome"];
dotenv.config({ path: envFile });
dotenv.config({ path: ".env" });

const authedProject = (name, { skipVar, baseURL, ...overrides }) =>
  runProject(name, { skipVars: [skipVar, "SKIP_PASSWORDLESS"] })
    ? {
        name,
        testDir: `./tests/${name}`,
        ...overrides,
        use: { ...desktopChrome, baseURL, storageState: authFileFor(name) },
      }
    : null;

// See https://playwright.dev/docs/test-configuration.
const onCI = (process.env.CI ?? "false") === "true";
export default defineConfig({
  globalSetup: "./global-setup.js",
  globalTeardown: "./global-teardown.js",
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
  // The CloudWatch reporter is inert unless PUBLISH_METRICS is set, so this is
  // a no-op everywhere except the scheduled production run.
  reporter: onCI ? [["list"], ["./utils/cloudwatchReporter.js"]] : "html",
  use: {
    trace: onCI ? "off" : "retain-on-failure",
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: wafBypassHeaders(),
  },
  timeout: 30 * 1000, // 30 seconds
  projects: [
    {
      name: "api",
      testDir: "./tests/api",
      use: { ...desktopChrome },
    },
    {
      name: "frontend",
      testDir: "./tests/frontend",
      use: { ...desktopChrome },
    },
    authedProject("admin", {
      skipVar: "SKIP_ADMIN",
      baseURL: process.env.ADMIN_URL,
    }),
    authedProject("dev-hub", {
      skipVar: "SKIP_DEV_HUB",
      baseURL: process.env.DEV_HUB_URL,
      timeout: 60 * 1000, // keys take a while to be active/revoked
    }),
    authedProject("myott", {
      skipVar: "SKIP_MYOTT",
      baseURL: process.env.MYOTT_URL,
    }),
  ].filter(Boolean),
});
