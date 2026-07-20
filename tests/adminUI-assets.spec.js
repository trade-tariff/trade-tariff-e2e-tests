import { test, expect } from "@playwright/test";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";
import { monitorAssetErrors } from "../utils/assetErrorMonitor.js";

test.describe("Admin assets", () => {
  test("admin root loads JavaScript assets without errors", async ({
    page,
  }) => {
    const assetErrorMonitor = monitorAssetErrors(page);

    await new BasicAuthLoginPage(process.env.ADMIN_URL, page, true).login();

    await page.waitForLoadState("networkidle");

    assetErrorMonitor.assertNoErrors();

    await expect(page.locator("body")).toBeVisible();
  });
});
