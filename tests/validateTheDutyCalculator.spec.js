import { test, expect } from '@playwright/test';

test.describe("Duty Calculator Integration", () => {
  test("Validating the duty calculator", async ({ page }) => {
    // Navigate to the duty calculator page
    await page.goto("/commodities/0702001007");
    await page.getByRole("link", { name: "work out the duties and taxes" }).click();

    // Navigate through the import destination step
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('radio', { name: 'England, Scotland or Wales (' }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate through the import origin step
    await page.locator("//input[@id='steps-country-of-origin-country-of-origin-field']").click();
    await page.getByRole('combobox', { name: 'Where are the goods coming' }).fill('Canada');
    await page.getByRole('combobox', { name: 'Where are the goods coming' }).press('Enter');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate through the customs value step
    await page.getByRole('textbox', { name: 'What is the value in GBP of' }).click();
    await expect(page.getByRole('heading', { name: 'What is the customs value of' })).toBeVisible();
    await page.getByRole('textbox', { name: 'What is the value in GBP of' }).fill('1000');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate through the Check your answers step
    await expect(page.getByRole("heading", { name: "Check your answers" })).toBeVisible();
    await page.getByRole('link', { name: 'Calculate import duties' }).click();

    // Verify we have results
    expect(page.getByRole('heading', { name: 'Import duty calculation' })).toBeVisible();
    expect(page.getByRole("heading", { name: "Option 1: Third-country duty" })).toBeVisible();
  });
});
