import assert from "node:assert/strict";
import test from "node:test";

import { readSampleRates, selectRates } from "./exchangeRateTable.js";

test("returns a rate for each requested currency code", () => {
  const rows = [
    { code: "EUR", rate: "1.1234" },
    { code: "USD", rate: "1.2345" },
    { code: "JPY", rate: "180.5" },
  ];

  const { rates, missing } = selectRates(rows, ["EUR", "USD"]);

  assert.deepEqual(rates, { EUR: "1.1234", USD: "1.2345" });
  assert.deepEqual(missing, []);
});

test("reports codes that are absent from the table", () => {
  const rows = [{ code: "EUR", rate: "1.1234" }];

  const { missing } = selectRates(rows, ["EUR", "USD"]);

  assert.deepEqual(missing, ["USD"]);
});

test("treats a present code with a blank rate as missing", () => {
  const rows = [
    { code: "EUR", rate: "1.1234" },
    { code: "USD", rate: "" },
  ];

  const { rates, missing } = selectRates(rows, ["EUR", "USD"]);

  assert.deepEqual(missing, ["USD"]);
  assert.deepEqual(rates, { EUR: "1.1234" });
});

test("reads the table once when every code is already present", async () => {
  let reads = 0;
  const readRows = async () => {
    reads += 1;
    return [
      { code: "EUR", rate: "1.1" },
      { code: "USD", rate: "1.2" },
    ];
  };

  const rates = await readSampleRates(readRows, ["EUR", "USD"], {
    sleep: async () => {},
  });

  assert.equal(reads, 1);
  assert.deepEqual(rates, { EUR: "1.1", USD: "1.2" });
});

test("re-reads the table while it is still rendering", async () => {
  let reads = 0;
  const readRows = async () => {
    reads += 1;
    if (reads < 3) {
      return [{ code: "EUR", rate: "1.1" }];
    }
    return [
      { code: "EUR", rate: "1.1" },
      { code: "USD", rate: "1.2" },
    ];
  };

  const rates = await readSampleRates(readRows, ["EUR", "USD"], {
    sleep: async () => {},
  });

  assert.equal(reads, 3);
  assert.deepEqual(rates, { EUR: "1.1", USD: "1.2" });
});

test("throws naming the missing codes and what the table actually held", async () => {
  const readRows = async () => [
    { code: "EUR", rate: "1.1" },
    { code: "JPY", rate: "180" },
  ];

  await assert.rejects(
    () =>
      readSampleRates(readRows, ["EUR", "USD"], {
        maxAttempts: 3,
        sleep: async () => {},
      }),
    (error) => {
      assert.match(error.message, /USD/);
      assert.match(error.message, /3 attempts/);
      assert.match(error.message, /2 rows/);
      assert.match(error.message, /EUR/);
      return true;
    },
  );
});
