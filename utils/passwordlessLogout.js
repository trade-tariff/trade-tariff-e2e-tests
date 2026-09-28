import fs from "node:fs/promises";
import path from "node:path";
import { expect, chromium } from "@playwright/test";

const authStatePath = path.resolve(
  import.meta.dirname,
  "../",
  "playwright",
  ".auth",
);

export default async function passwordlessLogout(url, { headers = {} } = {}) {
  const browser = await chromium.launch();

  const context = await browser.newContext({
    baseURL: url,
    extraHTTPHeaders: headers,
  });

  try {
    const page = await context.newPage();

    const startNowButton = page.getByRole("button", { name: "Start now" });
    const signOutLink = page.getByRole("link", { name: "Sign out" });
    const emailInput = page.getByRole("textbox", { name: "Email" });

    await page.goto(url);

    if (await startNowButton.isVisible()) {
      await startNowButton.click();
    }

    if (await emailInput.isVisible()) {
      console.log("Not logged in, session may have timed out.");
    }

    if (process.env.KEEP_AUTH) {
      console.warn(
        `KEEP_AUTH is set! Live auth state still exists at ${path.join(authStatePath, "auth.json")}`,
      );
      return;
    } else {
      if (await signOutLink.isVisible()) {
        await signOutLink.click();
        await page.waitForLoadState("domcontentloaded");
        await expect(page.getByText("You have been logged out.")).toBeVisible();
      }

      await fs.rm(path.join(authStatePath, "auth.json"));
    }
  } catch (error) {
    console.error("Could not log out:", error);
  } finally {
    await context.close();
    await browser.close();
  }
}
