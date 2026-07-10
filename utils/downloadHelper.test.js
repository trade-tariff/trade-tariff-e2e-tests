import assert from "node:assert/strict";
import test from "node:test";

import { filenameFromDisposition } from "./downloadHelper.js";

test("extracts RFC 5987 filename from content-disposition", () => {
  assert.equal(
    filenameFromDisposition(
      "attachment; filename*=UTF-8''exrates-monthly-0726.csv",
      "https://example.com/x",
      "https://example.com/y",
    ),
    "exrates-monthly-0726.csv",
  );
});

test("extracts quoted filename from content-disposition", () => {
  assert.equal(
    filenameFromDisposition(
      'attachment; filename="exrates-monthly-0726.csv"',
      "https://example.com/x",
      "https://example.com/y",
    ),
    "exrates-monthly-0726.csv",
  );
});

test("falls back to final URL path when disposition is missing", () => {
  assert.equal(
    filenameFromDisposition(
      "",
      "https://s3.example.com/data/monthly_csv_2026-7.csv?X-Amz-Signature=abc",
      "https://www.example.com/exchange_rates/view/files/monthly_csv_2026-7.csv",
    ),
    "monthly_csv_2026-7.csv",
  );
});
