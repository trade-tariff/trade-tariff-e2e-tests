import { test, expect } from '@playwright/test';
import LoginPage from '../pages/loginPage.js';

test.describe("Duty Calculator Integration", () => {
  test("Validating the duty calculator", async ({ page }) => {
    await new LoginPage("/commodities/0702001007", page).login()

    // Navigate through the import date step
    await page.getByRole("link", { name: "work out the duties and taxes" }).click();

    // Navigate through the import destination step
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('radio', { name: 'England, Scotland or Wales (' }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate through the import origin step
    await page.locator("//input[@id='duty-calculator-steps-country-of-origin-country-of-origin-field']").click();
    await page.getByRole('combobox', { name: 'Where are the goods coming' }).fill('Canada');
    await page.getByRole('combobox', { name: 'Where are the goods coming' }).press('Enter');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate through the customs value step
    await page.getByRole('textbox', { name: 'What is the value in GBP of' }).click();
    await page.getByRole('textbox', { name: 'What is the value in GBP of' }).fill('1000');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate through the Check your answers step
    await page.getByRole('link', { name: 'Calculate import duties' }).click();

    // Verify we have results
    await expect(page.getByRole("heading", { name: "Option 1: Third-country duty" })).toBeVisible();
  });
});
