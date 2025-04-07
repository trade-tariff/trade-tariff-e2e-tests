import { test, expect } from '@playwright/test';

test.describe("Exchange Rates", () => {
  test("Validating exchange rates", async ({ page }) => {
    await page.goto("/exchange_rates");

    // Validate monthly exchange rates
    await page.locator('a[title^="View"]').first().click();
    await expect(page.getByRole("columnheader", { name: "Country/territory" })).toBeVisible();
    await page.getByRole("link", { name: "Monthly exchange rates" }).click();

    // Validate average exchange rates
    await page.getByRole('link', { name: 'Currency exchange average rates' }).click();
    await page.locator('a[title^="View"]').first().click();
    await expect(page.getByRole("columnheader", { name: "Country/territory" })).toBeVisible();
    await page.getByRole("link", { name: "Average exchange rates" }).click();

    // Validate spot exchange rates
    await page.getByRole('link', { name: 'Currency exchange spot rates' }).click();
    await page.locator('a[title^="View"]').first().click();
    await expect(page.getByRole("columnheader", { name: "Country/territory" })).toBeVisible();
    await page.getByRole("link", { name: "Spot exchange rates" }).click();
  });
});
