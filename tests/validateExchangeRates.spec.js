const { test, expect } = require('@playwright/test');

test.describe("Exchange Rates", () => {
  test("Validating exchange rates", async ({ page }) => {
    await page.goto("/exchange_rates");
    await expect(page.getByRole('heading', { name: 'Check foreign currency' })).toBeVisible();
    await page.getByRole('link', { name: 'Currency exchange average' }).click();
    await expect(page.getByRole('heading', { name: 'HMRC currency exchange' })).toBeVisible();
    await page.getByRole('link', { name: 'Currency exchange spot rates' }).click();
    await expect(page.getByRole('heading', { name: 'HMRC currency exchange spot' })).toBeVisible();
  });
});
