import { test, expect } from '@playwright/test';

test.describe("Rules of origin Display", () => {
  test("Verify Rules of Origin are displayed for selected commodity", async ({ page }) => {
    await page.goto("/commodities/0409000010");
    await page.getByRole('combobox', { name: 'Select or enter a country' }).click();
    await page.getByRole('option', { name: 'Albania (AL)' }).click();
    await page.getByRole('button', { name: 'Set country' }).click();
    await page.getByRole('tab', { name: 'Origin' }).click();

    expect(page.getByRole('heading', { name: 'Preferential rules of origin for trading with Albania Flag for Albania' })).toBeVisible();
  });
});
