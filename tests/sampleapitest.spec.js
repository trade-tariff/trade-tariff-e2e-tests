import { test } from "@playwright/test";
import { validate } from "../utils/validateSchema";

test("GET /commodities/{id} returns valid JSON:API response", async ({
  request,
}) => {
  const commodityId = "0101210000";
  const res = await request.get(
    `https://www.trade-tariff.service.gov.uk/api/v2/commodities/${commodityId}`
  );
  const json = await res.json();

  validate(json);
});
