const { test, expect } = require('@playwright/test');

test.describe("SearchPage", () => {
  test("Validating the search function with goods name", async ({ page }) => {
    await page.goto('');
    await page.getByRole('combobox', { name: 'Search the UK Integrated' }).click();
    await page.getByRole('combobox', { name: 'Search the UK Integrated' }).fill('clothes');
    await page.getByRole('combobox', { name: 'Search the UK Integrated' }).press('Enter');
    await expect(page.getByRole("heading", { name: "Search results for ‘clothes’" })).toBeVisible();
    await page.getByRole("link", { name: "Hand-made (code 6217100010)" }).click();
    await expect(page.getByLabel('Breadcrumb').getByText('Commodity')).toBeVisible();
  });
  
  test.afterEach(async ({ page }) => {
    await page.close();
  });

})
