import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test.describe("Find Commodity", () => {
  test("searching commodity by reference", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();
    await page.locator('input[role="combobox"]').fill("ricotta");
    await page.locator('input[role="combobox"]').press("Enter");

    expect(page.url()).toContain("/commodities/0406105090");
  });

  test("searching commodity by code", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();
    await page.locator('input[role="combobox"]').fill("1701991000");
    await page.locator('input[role="combobox"]').press("Enter");

    expect(page.url()).toContain("/commodities/1701991000");

    const quotaMeasure = page.getByTitle("Preferential tariff quota");
    await quotaMeasure.first().scrollIntoViewIfNeeded();
    await expect(quotaMeasure.first()).toBeVisible();
  });

  // Guards against regressions where autocomplete init fails (e.g. debounce@3
  // rejecting a boolean third argument) and falls back to a plain text input
  // with no suggestion list.
  test("shows accessible autocomplete suggestions while typing", async ({
    page,
  }) => {
    await new LoginPage("/find_commodity", page).login();

    const keywordSearch = page.getByRole("radio", {
      name: "Keyword or commodity code search",
    });
    if (await keywordSearch.count()) {
      await keywordSearch.check();
    }

    const searchInput = page.locator('input[role="combobox"]');
    await expect(searchInput).toBeVisible();

    await searchInput.click();
    await searchInput.pressSequentially("tomato", { delay: 40 });

    await expect(
      page.getByRole("listbox").getByRole("option").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("option", { name: /tomato/i }).first(),
    ).toBeVisible();
  });

  test("submits the latest query instead of a stale suggestion", async ({
    page,
  }) => {
    let releaseLatestSuggestions;
    const latestSuggestionsHeld = new Promise((resolve) => {
      releaseLatestSuggestions = resolve;
    });

    await page.route("**/search_suggestions.json?*", async (route) => {
      const term = new URL(route.request().url()).searchParams.get("term");
      if (term === "tahini paste") {
        await latestSuggestionsHeld;
        await route.abort().catch(() => {});
        return;
      }

      await route.continue();
    });

    await new LoginPage("/find_commodity", page).login();

    const keywordSearch = page.getByRole("radio", {
      name: "Keyword or commodity code search",
    });
    if (await keywordSearch.count()) {
      await keywordSearch.check();
    }

    const searchInput = page.locator('input[role="combobox"]');
    await searchInput.fill("tahini");
    await expect(
      page.getByRole("option", { name: /tahini/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    try {
      await searchInput.fill("tahini paste");
      await expect(
        page.getByRole("option", { name: /tahini/i }).first(),
      ).toBeVisible();
      await searchInput.press("Enter");

      await expect(page).toHaveURL(/\/search$/);
      await expect(
        page.getByRole("heading", {
          name: /Search results for.*tahini paste/i,
        }),
      ).toBeVisible();
    } finally {
      releaseLatestSuggestions();
    }
  });
});
