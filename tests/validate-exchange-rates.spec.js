import { test, expect } from "@playwright/test";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";
import DownloadHelper from "../utils/downloadHelper.js";
import { assertExchangeRateCsv } from "../utils/exchangeRateCsv.js";

const SAMPLE_CODES = ["EUR", "USD", "JPY"];

/**
 * Read major currency rates from the online table so the CSV can be
 * cross-checked against the same page the user sees.
 */
async function sampleRatesFromTable(page, codes = SAMPLE_CODES) {
  const rows = await page.locator("table tbody tr").evaluateAll((trs) =>
    trs.map((tr) => {
      const cells = [...tr.querySelectorAll("td")].map((td) =>
        td.textContent.replace(/\s+/g, " ").trim(),
      );
      return {
        code: cells[2] ?? "",
        rate: cells[3] ?? "",
      };
    }),
  );

  const samples = {};
  for (const code of codes) {
    const match = rows.find((row) => row.code === code);
    expect(match, `online table missing ${code}`).toBeTruthy();
    expect(match.rate, `online table missing rate for ${code}`).toBeTruthy();
    samples[code] = match.rate;
  }
  return samples;
}

async function assertCsvMatchesTable(page, breadcrumbName, sampleRates) {
  await page
    .getByRole("link", { name: breadcrumbName })
    .click({ timeout: 20000 });
  await DownloadHelper.downloadAndVerify(
    page,
    page.getByRole("link", { name: /CSV\s+\d+\.?\d*\s*KB/ }).first(),
    /\.csv$/i,
    {
      assertBody: (body) => {
        assertExchangeRateCsv(body, sampleRates);
      },
    },
  );
}

test.describe("Exchange Rates", () => {
  test("Validating monthly exchange rates", async ({ page }) => {
    await new BasicAuthLoginPage("/exchange_rates", page).login();
    await page.locator('a[title^="View"]').first().click();
    await expect(
      page.getByRole("columnheader", { name: "Country/territory" }),
    ).toBeVisible({ timeout: 20000 });

    const sampleRates = await sampleRatesFromTable(page);
    await assertCsvMatchesTable(page, "Monthly exchange rates", sampleRates);
  });

  test("Validating average exchange rates", async ({ page }) => {
    await new BasicAuthLoginPage("/exchange_rates", page).login();
    await page
      .getByRole("link", { name: "Currency exchange average rates" })
      .click();
    await page.locator('a[title^="View"]').first().click();
    await expect(
      page.getByRole("columnheader", { name: "Country/territory" }),
    ).toBeVisible({ timeout: 20000 });

    const sampleRates = await sampleRatesFromTable(page);
    await assertCsvMatchesTable(page, "Average exchange rates", sampleRates);
  });

  test("Validating spot exchange rates", async ({ page }) => {
    await new BasicAuthLoginPage("/exchange_rates", page).login();
    await page
      .getByRole("link", { name: "Currency exchange spot rates" })
      .click();
    await page.locator('a[title^="View"]').first().click();
    await expect(
      page.getByRole("columnheader", { name: "Country/territory" }),
    ).toBeVisible({ timeout: 20000 });

    const sampleRates = await sampleRatesFromTable(page);
    await assertCsvMatchesTable(page, "Spot exchange rates", sampleRates);
  });
});
