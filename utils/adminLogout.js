import { chromium } from "@playwright/test";

export default async function adminLogout(url, { headers = {} } = {}) {
  const browser = await chromium.launch();

  const context = await browser.newContext({
    baseURL: url,
    extraHTTPHeaders: headers,
  });

  try {
    const page = await context.newPage();

    const startNow = page.getByRole("button", { name: "Start now" });
    const signOut = page.getByRole("link", { name: "Sign out" });
    const emailInput = page.locator('input[name="passwordless_form[email]"]');

    await page.goto(url);
    await startNow.click();

    if (await emailInput.isVisible()) {
      console.log("Not logged in, session may have timed out.");
    }

    if (await signOut.isVisible()) {
      await signOut.click();
      await page.waitForLoadState("domcontentloaded");
      await page.getByText("You have been logged out.");
    }
  } finally {
    await context.close();
    await browser.close();
  }
}
