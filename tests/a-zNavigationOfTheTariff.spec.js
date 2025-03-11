const { test, expect } = require('@playwright/test');

test.describe("A-Z Navigation", () => {
  test("Validating a-z navigation of the traiff", async ({ page }) => {
    await page.goto("/a-z-index/a");
    await expect(page.getByRole('heading', { name: 'A–Z of Classified Goods' })).toBeVisible();
    await page.getByRole('link', { name: 'Aa batteries (code: 8506)', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Heading 8506 - Primary cells' })).toBeVisible()
    await page.getByRole('link', { name: 'Commodity code 8506101100,' }).click();
    await expect(page.getByLabel("Breadcrumb").getByText("Commodity")).toBeVisible();
  });
})
