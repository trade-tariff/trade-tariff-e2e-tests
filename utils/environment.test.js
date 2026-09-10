import assert from "node:assert/strict";
import test from "node:test";

import { isProductionEnvironment } from "./environment.js";

test("treats the production base URL as production", () => {
  assert.equal(
    isProductionEnvironment("https://www.trade-tariff.service.gov.uk"),
    true,
  );
});

test("treats staging and development base URLs as not production", () => {
  assert.equal(
    isProductionEnvironment("https://staging.trade-tariff.service.gov.uk"),
    false,
  );
  assert.equal(
    isProductionEnvironment("https://dev.trade-tariff.service.gov.uk"),
    false,
  );
});

test("treats a missing base URL as not production rather than throwing", () => {
  assert.equal(isProductionEnvironment(undefined), false);
  assert.equal(isProductionEnvironment(""), false);
});
