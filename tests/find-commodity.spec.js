import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test.describe("Find Commodity", () => {
  test("searching commodity by reference", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();
    await page.locator("#q").fill("ricotta");
    await page.locator("#q").press("Enter");

    expect(page.url()).toContain("/commodities/0406105090");
  });

  test("searching commodity by code", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();
    await page.locator("#q").fill("1701991000");
    await page.locator("#q").press("Enter");

    expect(page.url()).toContain("/commodities/1701991000");

    const quotaMeasure = page.getByTitle("Preferential tariff quota");
    await quotaMeasure.first().scrollIntoViewIfNeeded();
    await expect(quotaMeasure.first()).toBeVisible();
  });
});
