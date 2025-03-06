const { test, expect } = require('@playwright/test');

test.describe("Browser Page", () => {
    test("Validating the browserPageFunctionality", async ({ page }) => {

        // Navigate to the website 
        await page.goto("https://staging.trade-tariff.service.gov.uk/browse");
        await page.getByRole('link', { name: 'Section 1:   Live animals;' }).click();
        await page.getByRole('link', { name: 'Chapter 01:   Live animals' }).click();
        await page.getByRole('link', { name: 'Heading 01:   Live horses,' }).click();
        await page.getByRole('link', { name: 'Commodity code 0101210000,' }).click();
        await expect(page.getByLabel('Breadcrumb').getByText('Commodity')).toBeVisible();
        await page.close();
    })
    
})

