import { test, expect } from "@playwright/test";
import { validateApi } from "../utils/validateApi";

test("GET /commodities/{id} returns valid JSON:API response", async ({ request }) => {
  let result;
  result = await validateApi(request, "/api/v2/commodities/7013100000");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/headings/0101");
  expect(result).toBeDefined();
  result = await validateApi(request, "/api/v2/chapters/01");
  expect(result).toBeDefined();
});
