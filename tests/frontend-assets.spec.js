import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";
import { monitorAssetErrors } from "../utils/assetErrorMonitor.js";

test.describe("Frontend assets", () => {
  test("find commodity page loads JavaScript assets without errors", async ({
    page,
  }) => {
    const assetErrorMonitor = monitorAssetErrors(page);

    await new LoginPage("/find_commodity", page).login();
    await page.waitForLoadState("networkidle");

    assetErrorMonitor.assertNoErrors();

    await expect(
      page.getByRole("heading", {
        name: "Look up commodity codes, import duties, taxes and controls",
      }),
    ).toBeVisible();
  });
});
