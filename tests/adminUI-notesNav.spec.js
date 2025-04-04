import { test, expect } from "@playwright/test";
import LoginPage from '../pages/loginPage.js';

test.describe("Notes", () => {
  test.beforeEach(async ({ page }, testInfo) => await new LoginPage(page, testInfo).login());

  test("displays UK section notes and allows chapter notes editing", async ({ page }) => {
    await page.getByRole('link', { name: 'Section & chapter notes' }).click();
    await page.getByRole('link', { name: 'to 5' }).click();
    await page.getByRole('row', { name: '1 to 6 Live Animals Edit' }).getByRole('link').click();
    await expect(page.getByRole('button', { name: 'Update Chapter note' })).toBeVisible();
  });

  test("displays XI section notes and allows chapter notes editing", async ({ page, }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole("link", { name: "Section & chapter notes" }).click();
    await page.getByRole("link", { name: "to 5" }).click();
    await page.locator("#chapter_01").getByRole("cell", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Update Chapter note" })).toBeVisible();
  });
})
