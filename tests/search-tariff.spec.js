import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test.describe("Find Commodity Page", () => {
  test("Validating the search function with goods name", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();

  // 1) Search for a specific commodity
    await page.getByRole("combobox", { name: "Search the UK Integrated" }).click();
    await page.getByRole("combobox", { name: "Search the UK Integrated" }).fill("1701991000");
    await page.getByRole("combobox", { name: "Search the UK Integrated" }).press("Enter");

  // 2) Classification = White sugar
  await expect(page.getByRole('definition').filter({ hasText: 'White sugar' })).toBeVisible();

  // 3) Scroll to the Quotas section
  const quotasHeading = page.getByRole('heading', { name: /^Quotas$/i });
  await quotasHeading.scrollIntoViewIfNeeded();
  await expect(quotasHeading).toBeVisible();

  // 4) Assert a Non-preferential tariff quota row is visible
  const nonPref = page.locator('text=/\\bNon\\s*preferential\\s*tariff\\s*quota\\b/i');
  await expect(nonPref.first(), 'Expected a Non-preferential tariff quota').toBeVisible();
 
  //5) Assert order number + 0.00% duty are present in the same row
  const nonPrefRow = page.locator('tr:has-text("Non preferential tariff quota")');
  await expect(nonPrefRow.locator('text=/\\b05\\d{4,}\\b/').first()).toBeVisible(); // order no. like 054321
  await expect(nonPrefRow.locator('text=/0\\.00\\s*%/').first()).toBeVisible();     // duty rate 0.00%
});
});


