import { test, expect } from "../../fixtures.js";
import LoginPage from "../../pages/loginPage.js";

// These tests run keyword searches against the real search index. They show
// that the index is built, the backend answers, and the frontend renders the
// answer. The frontend specs replay recorded responses, so they cannot show
// this.
test.describe("Search results", () => {
  test("shows commodity matches for a keyword", async ({ page }) => {
    await new LoginPage("/search?q=tomato", page).login();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Search results for ‘tomato’",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Best commodity matches for ‘tomato’"),
    ).toBeVisible();

    const commodityLinks = page.locator('main a[href^="/commodities/"]');
    await expect(commodityLinks.first()).toBeVisible();
    await expect(commodityLinks.first()).toContainText(/tomato/i);
  });

  test("shows the heading that contains the keyword", async ({ page }) => {
    await new LoginPage("/search?q=tomato", page).login();

    await expect(
      page.getByRole("heading", {
        name: "Other results containing the term ‘tomato’",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Tomatoes, fresh or chilled" }).first(),
    ).toHaveAttribute("href", /^\/headings\/0702/);
  });

  test("opens the commodity page for a chosen match", async ({ page }) => {
    await new LoginPage("/search?q=tomato", page).login();

    const firstMatch = page.locator('main a[href^="/commodities/"]').first();
    const href = await firstMatch.getAttribute("href");
    const commodityCode = href.match(/^\/commodities\/(\d{10})/)[1];

    await firstMatch.click();

    await expect(page).toHaveURL(new RegExp(`/commodities/${commodityCode}`));
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: `Commodity ${commodityCode}`,
      }),
    ).toBeVisible();
  });

  test("answers a query that matches nothing without an error", async ({
    page,
  }) => {
    await new LoginPage("/search?q=xyzzyqwertyplugh", page).login();

    // The service does not show a "no results" message for this query. It
    // returns its nearest matches. This test only guards against an error
    // page.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Search results for ‘xyzzyqwertyplugh’",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Getting help from HMRC if you need to find a commodity code",
      }),
    ).toBeVisible();
  });

  test("shows Northern Ireland matches that link to the Northern Ireland tariff", async ({
    page,
  }) => {
    await new LoginPage("/xi/search?q=tomato", page).login();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Search results for ‘tomato’",
      }),
    ).toBeVisible();

    const commodityLinks = page.locator('main a[href^="/xi/commodities/"]');
    await expect(commodityLinks.first()).toBeVisible();
    await expect(commodityLinks.first()).toContainText(/tomato/i);
  });
});
