import { test, expect } from '@playwright/test';
import LoginPage from '../pages/loginPage.js';
import DownloadHelper from '../utils/downloadHelper.js';

test.describe("Exchange Rates", () => {
  test("Validating monthly exchange rates", async ({ page }) => {
    await new LoginPage("/exchange_rates", page).login();
    await page.locator('a[title^="View"]').first().click();
    await expect(page.getByRole("columnheader", { name: "Country/territory" })).toBeVisible();
    await page.getByRole("link", { name: "Monthly exchange rates" }).click();

    await DownloadHelper.downloadAndVerify(page, page.getByRole('link', { name: /CSV\s+\d+\.?\d*\s*KB/ }).first());
  });

  test("Validating average exchange rates", async ({ page }) => {
    await new LoginPage("/exchange_rates", page).login();
    await page.getByRole('link', { name: 'Currency exchange average rates' }).click();
    await page.locator('a[title^="View"]').first().click();
    await expect(page.getByRole("columnheader", { name: "Country/territory" })).toBeVisible();
    await page.getByRole("link", { name: "Average exchange rates" }).click();

    await DownloadHelper.downloadAndVerify(page, page.getByRole('link', { name: /CSV\s+\d+\.?\d*\s*KB/ }).first());
  });

  test("Validating spot exchange rates", async ({ page }) => {
    await new LoginPage("/exchange_rates", page).login();
    await page.getByRole('link', { name: 'Currency exchange spot rates' }).click();
    await page.locator('a[title^="View"]').first().click();
    await expect(page.getByRole("columnheader", { name: "Country/territory" })).toBeVisible();
    await page.getByRole("link", { name: "Spot exchange rates" }).click();

    await DownloadHelper.downloadAndVerify(page, page.getByRole('link', { name: /CSV\s+\d+\.?\d*\s*KB/ }).first());
  });
});
