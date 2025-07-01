import { test, expect } from "@playwright/test";
import LoginPage from '../pages/loginPage.js';

test.describe("Admin updates", () => {
  test.beforeEach(async ({ page }) => await new LoginPage(process.env.ADMIN_URL, page, true).login());

  test("Validate UK updates", async ({ page }) => {
    await page.getByRole("listitem").filter({ hasText: "Updates" }).click();

    await expect(page.getByRole("heading", { name: "Tariff Updates - CDS" })).toBeVisible();
  });

  test("Validate XI updates", async ({ page }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole("listitem").filter({ hasText: "Updates" }).click();

    await expect(page.getByRole("heading", { name: "Tariff Updates - Taric" })).toBeVisible();
  });
});
