import assert from "node:assert/strict";
import test from "node:test";

import {
  assertExchangeRateCsv,
  parseExchangeRateCsv,
} from "./exchangeRateCsv.js";

const SAMPLE_CSV = `Country/Territories,Currency,Currency Code,Currency Units per £1,Start date,End date
Eurozone,Euro,EUR,1.1564,01/07/2026,31/07/2026
USA,Dollar,USD,1.3404,01/07/2026,31/07/2026
Japan,Yen,JPY,214.8908,01/07/2026,31/07/2026
`;

// pad to satisfy minRows in unit tests via option override
function paddedCsv(extraRows = 50) {
  const lines = [SAMPLE_CSV.trim()];
  for (let i = 0; i < extraRows; i += 1) {
    lines.push(
      `Country${i},Cur${i},C${i},${(i + 1).toFixed(4)},01/07/2026,31/07/2026`,
    );
  }
  return `${lines.join("\n")}\n`;
}

test("parseExchangeRateCsv reads headers and rows", () => {
  const { headers, rows } = parseExchangeRateCsv(SAMPLE_CSV);
  assert.equal(headers[2], "Currency Code");
  assert.equal(rows.length, 3);
  assert.equal(rows[0]["Currency Code"], "EUR");
  assert.equal(rows[0]["Currency Units per £1"], "1.1564");
});

test("assertExchangeRateCsv accepts valid file and matching samples", () => {
  const { rows } = assertExchangeRateCsv(
    paddedCsv(),
    {
      EUR: "1.1564",
      USD: "1.3404",
      JPY: "214.8908",
    },
    { minRows: 50 },
  );
  assert.ok(rows.length >= 50);
});

test("assertExchangeRateCsv rejects rate mismatch vs online samples", () => {
  assert.throws(
    () =>
      assertExchangeRateCsv(paddedCsv(), { EUR: "9.9999" }, { minRows: 50 }),
    /CSV rate mismatch for EUR/,
  );
});

test("assertExchangeRateCsv rejects HTML bodies", () => {
  assert.throws(
    () =>
      assertExchangeRateCsv("<!DOCTYPE html><html></html>", {}, { minRows: 1 }),
    /looks like HTML/,
  );
});

test("assertExchangeRateCsv rejects non-positive rates", () => {
  const bad = `Country/Territories,Currency,Currency Code,Currency Units per £1,Start date,End date
Eurozone,Euro,EUR,0,01/07/2026,31/07/2026
`;
  assert.throws(
    () => assertExchangeRateCsv(bad, {}, { minRows: 1 }),
    /Invalid rate for EUR/,
  );
});
