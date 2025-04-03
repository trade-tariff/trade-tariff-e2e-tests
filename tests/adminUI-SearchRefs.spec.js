import { test, expect } from "@playwright/test";

test.describe("Search References", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const isProduction = !!testInfo.project.use.baseURL.match(/www.trade-tariff.service.gov.uk/);
    const adminUrl = process.env.ADMIN_URL;
    const password = process.env.BASIC_PASSWORD;
    test.skip(isProduction, 'Skipping in production');
    await page.goto(adminUrl);
    await page.getByRole("textbox", { id: "basic-session-password-field" }).fill(password);
    await page.getByRole("button", { name: "Continue" }).click();
  });

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
