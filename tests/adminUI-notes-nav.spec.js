import { test, expect } from "@playwright/test";
import LoginPage from '../pages/loginPage.js';

test.describe("Notes", () => {
  test.beforeEach(async ({ page }) => await new LoginPage(process.env.ADMIN_URL, page, true).login());

  test("displays UK section notes and allows chapter notes editing", async ({ page }) => {
    await page.getByRole('link', { name: '1 to 5' }).click();
    await page.getByRole('row', { name: '0101 to 0106' }).getByRole('link').click();

    await expect(page.getByRole('button', { name: 'Update Chapter note' })).toBeVisible();
  });

  test("displays XI section notes and allows chapter notes editing", async ({ page, }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole('link', { name: '1 to 5' }).click();
    await page.getByRole('row', { name: '0101 to 0106' }).getByRole('link').click();

    await expect(page.getByRole("button", { name: "Update Chapter note" })).toBeVisible();
  });
})
