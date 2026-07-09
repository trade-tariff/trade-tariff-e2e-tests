import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";
import { monitorAssetErrors } from "../utils/assetErrorMonitor.js";

test.describe("Admin assets", () => {
  test("classification configuration page loads JavaScript assets without errors", async ({
    page,
  }) => {
    const assetErrorMonitor = monitorAssetErrors(page);

    await new LoginPage(
      `${process.env.ADMIN_URL}/classification_configurations`,
      page,
      true,
    ).login();

    await page.waitForLoadState("networkidle");

    assetErrorMonitor.assertNoErrors();

    await expect(
      page.getByRole("heading", { name: "Classification Configurations" }),
    ).toBeVisible();
  });
});
