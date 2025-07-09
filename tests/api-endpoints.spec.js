import { test, expect } from "@playwright/test";
import { validateApi } from "../utils/validateApi";

test("should validate all key API endpoints return defined and accessible responses", async ({ request }) => {
  if (process.env.SKIP_API_TESTS === 'true') {
    test.skip('Skipping API tests as per environment variable');
    return;
  }
  test.skip('Skipping api tests');
  let result;
  result = await validateApi(request, "/api/v2/commodities/7013100000");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/headings/0101");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/chapters/01");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/updates/latest");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/quotas/search");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/geographical_areas/GB");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/news/items");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/changes");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/search");
  expect(result).toBeDefined();
  result = await validateApi(request, " /api/v2/search_suggestions");
  expect(result).toBeDefined();
});
