import { test, expect } from '@playwright/test';
import LoginPage from '../pages/loginPage.js';

test.describe("Search for quotas", () => {
  test("Validate UK quota Search Results", async ({ page }) => {
    await new LoginPage("/quota_search", page).login();

    await expect(page.getByRole('heading', { name: 'Search for quotas' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Enter the 6-digit quota order' }).fill('052016');
    //Select a country to which the quota applies
    await page.getByRole('combobox', { name: 'Select a country to which the' }).click();
    await page.getByRole("option", { name: "Albania (AL)" }).click();
    //search for quotas
    await page.getByRole('button', { name: 'Search for quotas' }).click();
    //Validation
    await expect(page.getByRole("heading", { name: "Quota search results" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Order number" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Opens in a popup" })).toHaveText("052016");
  })
});
