import { test, expect } from "../fixtures.js";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";
import { monitorAssetErrors } from "../utils/assetErrorMonitor.js";

test.describe("Frontend assets", () => {
  test("find commodity page loads JavaScript assets without errors", async ({
    page,
  }) => {
    const assetErrorMonitor = monitorAssetErrors(page);

    await new BasicAuthLoginPage("/find_commodity", page).login();
    await page.waitForLoadState("load");

    assetErrorMonitor.assertNoErrors();

    await expect(
      page.getByRole("heading", {
        name: "Look up commodity codes, import duties, taxes and controls",
      }),
    ).toBeVisible();

    assetErrorMonitor.assertNoErrors();
  });
});
