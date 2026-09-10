const DEFAULT_MAX_ATTEMPTS = 8;
const DEFAULT_INTERVAL_MS = 500;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function selectRates(rows, codes) {
  const rates = {};
  const missing = [];

  for (const code of codes) {
    const match = rows.find((row) => row.code === code);

    if (match && match.rate) {
      rates[code] = match.rate;
    } else {
      missing.push(code);
    }
  }

  return { rates, missing };
}

/**
 * The rates table is read straight out of the DOM, so a single snapshot can
 * catch it part-rendered and report a currency as absent when it is merely
 * late. Re-read until every sampled code is present, then fail with what the
 * table actually held so the next failure is diagnosable.
 */
export async function readSampleRates(
  readRows,
  codes,
  {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    intervalMs = DEFAULT_INTERVAL_MS,
    sleep = defaultSleep,
  } = {},
) {
  let lastRows = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastRows = await readRows();
    const { rates, missing } = selectRates(lastRows, codes);

    if (missing.length === 0) {
      return rates;
    }

    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  const { missing } = selectRates(lastRows, codes);
  const seen = lastRows.map((row) => row.code).join(", ") || "none";

  throw new Error(
    `Exchange rate table missing ${missing.join(", ")} after ${maxAttempts} attempts; ` +
      `last read ${lastRows.length} rows with codes: ${seen}`,
  );
}
