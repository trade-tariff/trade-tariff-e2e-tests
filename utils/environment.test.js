import assert from "node:assert/strict";
import test from "node:test";

import { isProductionEnvironment } from "./environment.js";

function withBaseUrl(value, assertion) {
  const original = process.env.BASE_URL;

  if (value === undefined) {
    delete process.env.BASE_URL;
  } else {
    process.env.BASE_URL = value;
  }

  try {
    assertion();
  } finally {
    if (original === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = original;
    }
  }
}

test("treats the production base URL as production", () => {
  assert.equal(
    isProductionEnvironment("https://www.trade-tariff.service.gov.uk"),
    true,
  );
});

test("ignores host casing, which DNS treats as insignificant", () => {
  assert.equal(
    isProductionEnvironment("https://WWW.Trade-Tariff.Service.GOV.UK"),
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

test("treats a domain that merely contains the production host as not production", () => {
  assert.equal(
    isProductionEnvironment(
      "https://www.trade-tariff.service.gov.uk.example.test",
    ),
    false,
  );
});

test("ignores the production host appearing outside the hostname", () => {
  assert.equal(
    isProductionEnvironment(
      "https://example.test/?proxy=www.trade-tariff.service.gov.uk",
    ),
    false,
  );
});

test("treats a missing base URL as not production rather than throwing", () => {
  withBaseUrl(undefined, () => {
    assert.equal(isProductionEnvironment(), false);
  });

  assert.equal(isProductionEnvironment(""), false);
});

test("reads BASE_URL when called with no argument", () => {
  withBaseUrl("https://www.trade-tariff.service.gov.uk", () => {
    assert.equal(isProductionEnvironment(), true);
  });

  withBaseUrl("https://staging.trade-tariff.service.gov.uk", () => {
    assert.equal(isProductionEnvironment(), false);
  });
});
