import { test, expect } from "@playwright/test";
import LoginPage from '../pages/loginPage.js';

test.describe("Search References", () => {
  test.beforeEach(async ({ page }) => await new LoginPage(process.env.ADMIN_URL, page, true).login());

  test("should display UK search references", async ({ page }) => {
    await page.getByRole("link", { name: "Search references" }).click();
    await page.getByRole("link", { name: "1 to 5" }).click();
    await page.getByRole("link", { name: "0101 to 0106" }).click();
    await page.getByRole("link", { name: "Commodities in 0101" }).click();

    await expect(page.getByRole("heading", { name: "Commodities search references of heading 0101:Live Horses, Asses, Mules And Hinnies" })).toBeVisible();
  });

  test("should display XI Search references", async ({ page }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole("link", { name: "Search references" }).click();
    await page.getByRole("link", { name: "1 to 5" }).click();
    await page.getByRole("link", { name: "0101 to 0106" }).click();
    await page.getByRole("link", { name: "Commodities in 0101" }).click();

    await expect(page.getByRole("heading", { name: "Commodities search references of heading 0101:Live Horses, Asses, Mules And Hinnies" })).toBeVisible();
  });
});
