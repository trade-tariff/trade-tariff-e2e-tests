const { test, expect } = require('@playwright/test');

test.describe("BrowserPage", () => {
  test("Validating browsing the tariff", async ({ page }) => {
    await page.goto('/browse');
    await page.getByRole('link', { name: 'Section 1: Live animals;' }).click();
    await page.getByRole('link', { name: 'Chapter 01: Live animals' }).click();
    await page.getByRole('link', { name: 'Heading 01: Live horses,' }).click();
    await page.getByRole('link', { name: 'Commodity code 0101210000,' }).click();
    await expect(page.getByLabel('Breadcrumb').getByText('Commodity')).toBeVisible();
  });
})
