import { test, expect } from "../fixtures.js";
import LoginPage from "../pages/loginPage.js";
import DownloadHelper from "../utils/downloadHelper.js";
import { assertExchangeRateCsv } from "../utils/exchangeRateCsv.js";
import { readSampleRates } from "../utils/exchangeRateTable.js";

const SAMPLE_CODES = ["EUR", "USD", "JPY"];

function readRateRows(page) {
  return page.locator("table tbody tr").evaluateAll((trs) =>
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
}

/**
 * Read major currency rates from the online table so the CSV can be
 * cross-checked against the same page the user sees.
 */
async function sampleRatesFromTable(page, codes = SAMPLE_CODES) {
  return readSampleRates(() => readRateRows(page), codes);
}

async function assertCsvMatchesTable(page, sampleRates) {
  await DownloadHelper.downloadAndVerify(
    page,
    page
      .getByRole("link", {
        name: /CSV(?:\s+file)?\s*\(?\d+(?:\.\d+)?\s*KB\)?/,
      })
      .first(),
    /\.csv$/i,
    {
      assertBody: (body) => {
        assertExchangeRateCsv(body, sampleRates);
      },
    },
  );
}

const RATE_PAGES = [
  { name: "monthly", path: "/exchange_rates" },
  { name: "average", path: "/exchange_rates/average" },
  { name: "spot", path: "/exchange_rates/spot" },
];

test.describe("Exchange Rates", () => {
  for (const { name, path } of RATE_PAGES) {
    test(`Validating ${name} exchange rates`, async ({ page }) => {
      await new LoginPage(path, page).login();
      await page.locator('a[title^="View"]').first().click();
      await expect(
        page.getByRole("columnheader", { name: "Country/territory" }),
      ).toBeVisible({ timeout: 20000 });

      const sampleRates = await sampleRatesFromTable(page);
      await assertCsvMatchesTable(page, sampleRates);
    });
  }
});
