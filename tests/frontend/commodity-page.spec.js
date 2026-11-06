import { test, expect } from "../../fixtures.js";
import LoginPage from "../../pages/loginPage.js";

// Cherry tomatoes. The commodity exists in the UK and XI tariffs and has
// duties, VAT, controls, quotas and a preferential rate for Albania.
const COMMODITY_PATH = "/commodities/0702001007";
const XI_COMMODITY_PATH = "/xi/commodities/0702001007";

test.describe("Commodity page", () => {
  test("shows the UK import measures from the live backend", async ({
    page,
  }) => {
    await new LoginPage(COMMODITY_PATH, page).login();

    await expect(
      page.getByRole("heading", { level: 1, name: "Commodity 0702001007" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /^Importing into the UK from All countries on /,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Import duties" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Import VAT" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Import controls" }),
    ).toBeVisible();

    const thirdCountryDuty = page
      .locator("table.measures tbody tr")
      .filter({ hasText: "Third country duty" });
    await expect(thirdCountryDuty.first()).toBeVisible();
    await expect(thirdCountryDuty.first()).toContainText("%");
  });

  test("shows the preferential measure after choosing a country", async ({
    page,
  }) => {
    await new LoginPage(COMMODITY_PATH, page).login();

    await page
      .getByRole("combobox", { name: /goods produced or coming from/ })
      .click();
    await page.getByRole("option", { name: "Albania (AL)" }).click();
    await page.getByRole("button", { name: "Update page" }).click();

    await expect(page).toHaveURL(/country=AL/);
    await expect(
      page.getByRole("heading", {
        name: /^Importing into the UK from Albania on /,
      }),
    ).toBeVisible();
    // Preferential rates sit in a collapsed section, headed "View N
    // preferential rates". N changes with the data, so match the words only.
    await page
      .getByText(/View \d+ preferential rates?/)
      .first()
      .click();
    await expect(
      page
        .locator("table.measures tbody tr")
        .filter({ hasText: "Tariff preference" })
        .first(),
    ).toBeVisible();
  });

  test("shows the measures for a chosen date", async ({ page }) => {
    await new LoginPage(COMMODITY_PATH, page).login();

    // The commodity has existed since 1 January 2025. A date before that shows
    // a "could not be found for the date selected" page instead.
    await page.getByRole("textbox", { name: "Day" }).fill("1");
    await page.getByRole("textbox", { name: "Month" }).fill("6");
    await page.getByRole("textbox", { name: "Year" }).fill("2025");
    await page.getByRole("button", { name: "Update page" }).click();

    await expect(
      page.getByRole("heading", {
        name: "Importing into the UK from All countries on 1 June 2025",
      }),
    ).toBeVisible();
    await expect(page.locator("table.measures tbody tr").first()).toBeVisible();
  });

  test("switches between the import and export tabs", async ({ page }) => {
    await new LoginPage(COMMODITY_PATH, page).login();

    const exportHeading = page.getByRole("heading", {
      name: /^Exporting from the UK to All countries on /,
    });
    await expect(exportHeading).toBeHidden();

    await page.getByRole("tab", { name: "Export" }).click();
    await expect(exportHeading).toBeVisible();

    await page.getByRole("tab", { name: "Import" }).click();
    await expect(exportHeading).toBeHidden();
    await expect(
      page.getByRole("heading", {
        name: /^Importing into the UK from All countries on /,
      }),
    ).toBeVisible();
  });

  test("opens the conditions dialog for a measure", async ({ page }) => {
    await new LoginPage(COMMODITY_PATH, page).login();

    const conditionsButton = page
      .getByRole("button", {
        name: "Click to open a dialog with the conditions for this measure",
      })
      .first();
    await conditionsButton.scrollIntoViewIfNeeded();
    await conditionsButton.click();

    // Every measure has its own empty modal container. Only the opened one
    // is filled, so match on content.
    const dialog = page
      .locator(".modal.tariff-info")
      .filter({ hasText: /\S/ })
      .first();
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toBeEmpty();
  });

  test("shows the Northern Ireland measures and switches back to the UK tariff", async ({
    page,
  }) => {
    await new LoginPage(XI_COMMODITY_PATH, page).login();

    await expect(page).toHaveTitle(/Northern Ireland Online Tariff/);
    await expect(
      page.getByRole("heading", {
        name: /^Importing into Northern Ireland from All countries on /,
      }),
    ).toBeVisible();
    await expect(
      page
        .locator("table.measures tbody tr")
        .filter({ hasText: "Third country duty" })
        .first(),
    ).toBeVisible();

    await page
      .getByRole("link", { name: /Change to England, Scotland and Wales/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/commodities\/0702001007/);
    await expect(page).toHaveTitle(/UK Integrated Online Tariff/);
  });
});
