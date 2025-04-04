import { test, expect } from "@playwright/test";
import LoginPage from '../pages/loginPage.js';

test.describe("Search References", () => {
  test.beforeEach(async ({ page }, testInfo) => await new LoginPage(page, testInfo).login());

  test("should display UK search references", async ({ page }) => {
    await page.getByRole("link", { name: "Search references" }).click();
    await page.getByRole("link", { name: "Search references" }).click();
    await page.getByRole("link", { name: "to 5" }).click();
    await page.getByRole("link", { name: "to 6" }).click();
    await page.getByRole("link", { name: "Commodities in 0101" }).click();
    await expect(page.getByRole("heading", { name: "Commodities search references" })).toBeVisible();
  });

  test("should display XI Search references", async ({ page }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole("link", { name: "Search references" }).click();
    await page.getByRole("link", { name: "to 5" }).click();
    await page.getByRole("link", { name: "to 6" }).click();
    await page.getByRole("link", { name: "Commodities in 0101" }).click();
    await expect(page.getByRole("heading", { name: "Commodities search references" })).toBeVisible();
  });
});
