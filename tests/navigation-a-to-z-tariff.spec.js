import { test, expect } from '@playwright/test';
import LoginPage from '../pages/loginPage.js';

test.describe("A-Z Navigation", () => {
  test("Validating a-z navigation of the tariff", async ({ page }) => {
    await new LoginPage("/a-z-index/a", page).login()
    await page.getByRole('link', { name: 'Aa batteries (code: 8506)', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Heading 8506 - Primary cells' })).toBeVisible()
  });
});
