import { test, expect } from "@playwright/test";

test.describe("Admin updates", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const isProduction = !!testInfo.project.use.baseURL.match(/www.trade-tariff.service.gov.uk/);
    const adminUrl = process.env.ADMIN_URL;
    const password = process.env.BASIC_PASSWORD;
    test.skip(isProduction, 'Skipping in production');
    await page.goto(adminUrl);
    await page.getByRole("textbox", { id: "basic-session-password-field" }).fill(password);
    await page.getByRole("button", { name: "Continue" }).click();
  });

  test("Validate UK updates", async ({ page }) => {
    await page.getByRole("listitem").filter({ hasText: "Updates" }).click();
    await expect(page.getByRole("heading", { name: "Tariff Updates - CDS" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Issue date" })).toBeVisible();
  });

  test("Validate XI updates", async ({ page }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole("listitem").filter({ hasText: "Updates" }).click();
    await expect(page.getByRole("heading", { name: "Tariff Updates - Taric" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Issue date" })).toBeVisible();
  });
});
