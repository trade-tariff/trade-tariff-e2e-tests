const { test, expect } = require('@playwright/test');
import { baseUrl } from "../playwright-variables";

test.describe("BrowserPage", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });
  
    test("Validating the browserPageFunctionality", async ({ page }) => {
        await page.getByRole('link', { name: 'Section 1:   Live animals;' }).click();
        await page.getByRole('link', { name: 'Chapter 01:   Live animals' }).click();
        await page.getByRole('link', { name: 'Heading 01:   Live horses,' }).click();
        await page.getByRole('link', { name: 'Commodity code 0101210000,' }).click();
        await expect(page.getByLabel('Breadcrumb').getByText('Commodity')).toBeVisible();
        await page.close();
    })
  })


