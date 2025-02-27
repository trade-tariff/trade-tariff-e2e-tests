import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? 'development'
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`)
dotenv.config({ path: envFile })

// See https://playwright.dev/docs/test-configuration.
const onCI = (process.env.CI ?? 'false') === 'true'
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: onCI,
  retries: onCI ? 2 : 0,
  workers: onCI ? 1 : undefined,
  reporter: 'html',
  use: { trace: 'on' },
  // TODO: Set the timeout that makes sense for the OTT project
  // timeout: 140000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
