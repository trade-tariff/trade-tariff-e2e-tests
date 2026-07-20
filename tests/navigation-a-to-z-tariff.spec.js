import { test, expect } from "@playwright/test";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";

test.describe("A-Z Navigation", () => {
  test("Validating a-z navigation of the tariff", async ({ page }) => {
    await new BasicAuthLoginPage("/a-z-index/a", page).login();
    await page
      .getByRole("link", { name: "Abaci (abacus) (code: 9503)", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: "Heading 9503 - Tricycles" }),
    ).toBeVisible();
  });
});
