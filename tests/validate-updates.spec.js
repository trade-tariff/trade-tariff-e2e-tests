import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";
import validateTariffDate from "../utils/tariffDate.js";

test.describe("Validate updates", () => {
  test("Validating updates are happening", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();

    const locator = page.locator("#last-updated-at p", {
      hasText: /Last updated:\s+\d{1,2}\s\w+\s\d{4}/,
    });
    const lastUpdatedText = await locator.textContent();

    let found = false;
    found = validateTariffDate(0, lastUpdatedText);
    found ||= validateTariffDate(1, lastUpdatedText);
    found ||= validateTariffDate(2, lastUpdatedText);

    expect(found).toBeTruthy();
  });
});
