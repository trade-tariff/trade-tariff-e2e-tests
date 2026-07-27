import { adminTest as test, expect } from "../fixtures.js";
import LoginPage from "../pages/loginPage.js";
import { monitorAssetErrors } from "../utils/assetErrorMonitor.js";

test.describe("Admin assets", () => {
  test("admin root loads JavaScript assets without errors", async ({
    page,
  }) => {
    const assetErrorMonitor = monitorAssetErrors(page);

    await new LoginPage(process.env.ADMIN_URL, page, true).login();
    await page.waitForLoadState("load");

    await expect(page.locator("body")).toBeVisible();

    assetErrorMonitor.assertNoErrors();
  });
});
