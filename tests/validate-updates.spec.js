import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";
import validateTariffDate from "../utils/tariffDate.js";

test.describe("Validate updates", () => {
  test.skip("Validating updates are happening", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();

    const locator = page.locator("#last-updated-at p", {
      hasText: /Last updated:\s+\d{1,2}\s\w+\s\d{4}/,
    });
    const lastUpdatedText = await locator.textContent();

    const found =
      validateTariffDate(0, lastUpdatedText) ||
      validateTariffDate(1, lastUpdatedText) ||
      validateTariffDate(2, lastUpdatedText);

    expect(found).toBeTruthy();
  });
});
