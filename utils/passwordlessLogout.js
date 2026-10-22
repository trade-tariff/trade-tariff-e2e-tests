import fs from "node:fs/promises";
import path from "node:path";
import { expect, chromium } from "@playwright/test";
import { authFileFor } from "./projectArgs.js";

const root = path.resolve(import.meta.dirname, "../");

export default async function passwordlessLogout(
  name,
  url,
  { headers = {} } = {},
) {
  const authFile = path.join(root, authFileFor(name));

  if (process.env.KEEP_AUTH) {
    console.warn(
      `KEEP_AUTH is set! Live auth state still exists at ${authFile}`,
    );
    return;
  }

  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      baseURL: url,
      extraHTTPHeaders: headers,
      storageState: await fs
        .access(authFile)
        .then(() => authFile)
        .catch(() => undefined),
    });

    try {
      const page = await context.newPage();
      await page.goto(url);

      const startNowButton = page.getByRole("button", { name: "Start now" });
      if (await startNowButton.isVisible()) await startNowButton.click();

      const signOutLink = page.getByRole("link", { name: "Sign out" });

      const loggedOutLocators = page
        .getByText("You have been logged out.")
        .or(page.getByText("You have signed out"));

      if (await signOutLink.isVisible()) {
        await signOutLink.click();
        await page.waitForLoadState("domcontentloaded");
        await expect(loggedOutLocators).toBeVisible();
      } else {
        console.log(`[${name}] not logged in, session may have timed out.`);
      }
    } finally {
      await context.close();
    }
  } catch (error) {
    console.error(`[${name}] could not log out:`, error);
  } finally {
    await browser.close();
    await fs.rm(authFile, { force: true });
  }
}
