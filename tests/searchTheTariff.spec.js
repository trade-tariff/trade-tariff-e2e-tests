import { test, expect } from '@playwright/test';

test.describe("Find Commodity Page", () => {
  test("Validating the search function with goods name", async ({ page }) => {
    await page.goto('/find_commodity');
    await page.getByRole('combobox', { name: 'Search the UK Integrated' }).click();
    await page.getByRole('combobox', { name: 'Search the UK Integrated' }).fill('clothes');
    await page.getByRole('combobox', { name: 'Search the UK Integrated' }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Results matching ‘clothes’' })).toBeVisible();
  });
});
