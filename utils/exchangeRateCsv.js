/**
 * Lightweight exchange-rate CSV checks for e2e.
 * Monthly, average, and spot files share Currency Code + rate columns but
 * differ on other headers.
 */

const REQUIRED_HEADERS = ["Currency Code", "Currency Units per £1"];

export function parseExchangeRateCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(`CSV has too few lines (${lines.length})`);
  }

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    if (cells.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 2} has ${cells.length} columns, expected ${headers.length}`,
      );
    }
    return Object.fromEntries(headers.map((header, i) => [header, cells[i]]));
  });

  return { headers, rows };
}

function splitCsvLine(line) {
  // HMRC exchange-rate CSVs are unquoted simple fields.
  return line.split(",").map((cell) => cell.trim());
}

/**
 * @param {string|Buffer|Uint8Array} body
 * @param {Record<string, string>} [sampleRates] currency code → rate string from the online table
 * @param {{ minRows?: number }} [options]
 */
export function assertExchangeRateCsv(body, sampleRates = {}, options = {}) {
  const minRows = options.minRows ?? 5;
  const text = Buffer.isBuffer(body)
    ? body.toString("utf8")
    : typeof body === "string"
      ? body
      : Buffer.from(body).toString("utf8");

  if (/<!DOCTYPE html|<html[\s>]/i.test(text)) {
    throw new Error("Expected CSV file but body looks like HTML");
  }

  const { headers, rows } = parseExchangeRateCsv(text);

  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(
        `CSV missing required header "${required}". Got: ${headers.join(", ")}`,
      );
    }
  }

  if (rows.length < minRows) {
    throw new Error(
      `CSV has only ${rows.length} data rows; expected at least ${minRows}`,
    );
  }

  for (const row of rows) {
    const rate = Number(row["Currency Units per £1"]);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(
        `Invalid rate for ${row["Currency Code"]}: ${row["Currency Units per £1"]}`,
      );
    }
  }

  for (const [code, expectedRate] of Object.entries(sampleRates)) {
    if (expectedRate == null || expectedRate === "") {
      throw new Error(`Missing sample rate for ${code} from online table`);
    }
    const match = rows.find((row) => row["Currency Code"] === code);
    if (!match) {
      throw new Error(`CSV missing currency code ${code}`);
    }
    // Online table can show fewer decimal places than the file in edge cases;
    // compare numeric values rather than raw strings.
    const expected = Number(expectedRate);
    const actual = Number(match["Currency Units per £1"]);
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
      throw new Error(
        `Non-numeric rate for ${code}: online=${expectedRate}, csv=${match["Currency Units per £1"]}`,
      );
    }
    if (Math.abs(expected - actual) > 0.00005) {
      throw new Error(
        `CSV rate mismatch for ${code}: online table=${expectedRate}, csv=${match["Currency Units per £1"]}`,
      );
    }
  }

  return { headers, rows };
}
