import { test, expect } from "../fixtures.js";
import LoginPage from "../pages/loginPage.js";

test.describe("News Section", () => {
  test("Validating News section", async ({ page }) => {
    await new LoginPage("/news", page).login();
    // Navigate to the news section
    await expect(
      page.getByRole("heading", { name: "Trade tariff news bulletin" }),
    ).toBeVisible({ timeout: 10000 });
    await page.locator("//a[normalize-space()='2024']").click(); //Filter by previous year
    await page.locator("//a[normalize-space()='Trade news']").click(); //Filter by collection
    await expect(page).toHaveURL(/\/news\/collections\/trade_news\/2024/);

    await expect(page.locator(".news-item").first()).toBeVisible();
  });

  test("Validating live issues section", async ({ page }) => {
    await new LoginPage("/news", page).login();
    // Click on the view live issues log
    const liveIssueLink = page.getByRole("link", {
      name: "View live issues log",
    });
    await expect(liveIssueLink).toBeVisible({ timeout: 10000 });
    await liveIssueLink.click();

    await expect(page).toHaveURL(/\/live_issues/);
    await expect(
      page.getByRole("heading", { name: "Live issues log" }),
    ).toBeVisible();

    // The log legitimately empties out, so accept either the list or the
    // empty state, but require one of them to actually render.
    await expect(
      page
        .locator(".live-issues__list")
        .or(page.getByText("No live issues match the selected filters."))
        .first(),
    ).toBeVisible();
  });
});
