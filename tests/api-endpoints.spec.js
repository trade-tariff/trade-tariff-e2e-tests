import Jsona from "jsona";
import { test, expect } from "@playwright/test";
import { validateApi } from "../utils/validateApi";

const apiPaths = [
  "/api/v2/commodities/7013100000",
  "/api/v2/headings/0101",
  "/api/v2/chapters/01",
  "/api/v2/updates/latest",
  "/api/v2/quotas/search",
  "/api/v2/geographical_areas/GB",
  "/api/v2/news/items",
  "/api/v2/changes",
  "/api/v2/search",
  "/api/v2/search_suggestions"
];

test.describe("API Endpoints Validation", () => {
  for (const path of apiPaths) {
    test(`${path} returns valid responses`, async ({ request }) => {
      if (process.env.SKIP_API_TESTS === 'true') {
        test.skip(`Skipping API test for ${path} as per environment variable`);
        return;
      }
      const result = await validateApi(request, path);
      expect(result).toBeDefined();
    });
  }

  test("/api/v2/exchange_rates/:id supports filtering by type", async ({ request }) => {
    if (process.env.SKIP_API_TESTS === 'true') {
      test.skip("Skipping API test for exchange rates as per environment variable");
      return;
    }

    // NOTE: Monthly Exchange Rates are published on the penultimate Wednesday of the month
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const endOfMonth = new Date(year, date.getMonth() + 1, 0).getDate();
    const json = await request.get(`/api/v2/exchange_rates/${year}-${month}?filter[type]=monthly`);
    const formatter = new Jsona();
    const exchangeRates = formatter.deserialize(await json.json());
    const exchangeRate = exchangeRates.exchange_rates[0];

    expect(exchangeRates.year).toBe(String(year));
    expect(exchangeRates.month).toBe(String(month));
    expect(exchangeRate.validity_start_date).toBe(`${year}-${month}-01`);
    expect(exchangeRate.validity_end_date).toBe(`${year}-${month}-${endOfMonth}`);
  });
});
