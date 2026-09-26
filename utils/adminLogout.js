import { expect, chromium } from "@playwright/test";

export default async function adminLogout(url, { headers = {} } = {}) {
  const browser = await chromium.launch();

  const context = await browser.newContext({
    baseURL: url,
    extraHTTPHeaders: headers,
  });

  try {
    const page = await context.newPage();

    const startNowButton = page.getByRole("button", { name: "Start now" });
    const signOutLink = page.getByRole("link", { name: "Sign out" });
    const emailInput = page.locator('input[name="passwordless_form[email]"]');

    await page.goto(url);

    if (await startNowButton.isVisible()) {
      await startNowButton.click();
    }

    if (await emailInput.isVisible()) {
      console.log("Not logged in, session may have timed out.");
    }

    if (await signOutLink.isVisible()) {
      await signOutLink.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText("You have been logged out.")).toBeVisible();
    }
  } finally {
    await context.close();
    await browser.close();
  }
}
