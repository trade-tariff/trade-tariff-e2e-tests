const { test, expect } = require('@playwright/test');

test.describe("A-Z Navigation", () => {
  test("Validating a-z navigation of the tariff", async ({ page }) => {
    await page.goto("/a-z-index/a");
    await page.getByRole('link', { name: 'Aa batteries (code: 8506)', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Heading 8506 - Primary cells' })).toBeVisible()
  });
});
