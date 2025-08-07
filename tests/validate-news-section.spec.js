// create or open your test file tests/validate-news-section.spec.js
import { test, expect } from '@playwright/test';
import LoginPage from '../pages/loginPage.js';

test.describe("News Section", () => {
  test("Validating News section", async ({ page }) => {
    await new LoginPage("/news", page).login()
    // Navigate to the news section
    await expect(page.getByRole('heading', { name: 'Trade tariff news bulletin' })).toBeVisible();
    await page.locator("//a[normalize-space()='2024']").click(); //Filter by previous year
    await page.locator("//a[normalize-space()='Trade news']").click(); //Filter by collection
    await expect(page).toHaveURL(/\/news\/collections\/trade_news\/2024/); //  // Validate the URL
    //Check at least one news item is showing
    await page.waitForSelector('.news-item');
    // get the news items
    const newsItems = page.locator('.news-item');
    const count = await newsItems.count();
    if (count > 0) {
      await expect(newsItems.first()).toBeVisible();
    }
    else {
      console.log("No news items found, skipping validation.");
    }
  });

  test("Validating live issues section", async ({ page }) => {
    await new LoginPage("/news", page).login()
    // Click on the view live issues log
    const liveIssueLink = page.getByRole('link', { name: 'View live issues log' })
    await expect(liveIssueLink).toBeVisible();
    await liveIssueLink.click();
    // Validate the live issues log page
    const issueRows = page.locator('.news-item, tr');
    const count = await issueRows.count();
    // Check if there are any live issues
    if (count > 0) {
      await expect(issueRows.first()).toBeVisible();
    }
    else {
      console.log("No live issues found, skipping validation.");
    }
  });
});