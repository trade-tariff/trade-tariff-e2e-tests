import path from "path";
import dotenv from "dotenv";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`);
dotenv.config({ path: envFile });
dotenv.config({ path: ".env" });

const MAX_ATTEMPTS = 20;
const INTERVAL_MS = 5_000;
const BODY_PREVIEW_CHARS = 500;
const RESPONSE_HEADERS = [
  "cache-control",
  "content-length",
  "content-type",
  "date",
  "server",
  "via",
  "x-amz-cf-id",
  "x-amz-cf-pop",
  "x-cache",
  "x-request-id",
];

function responseHeaders(res) {
  return Object.fromEntries(
    RESPONSE_HEADERS.flatMap((header) => {
      const value = res.headers.get(header);
      return value ? [[header, value]] : [];
    }),
  );
}

async function responseBodyPreview(res) {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.match(/json|text|html|xml|plain/i)) {
    return undefined;
  }

  const body = await res.text();

  return body.length > BODY_PREVIEW_CHARS
    ? `${body.slice(0, BODY_PREVIEW_CHARS)}...`
    : body;
}

function logHealthcheck(event) {
  console.log(`healthcheck_response ${JSON.stringify(event)}`);
}

export default async function globalSetup() {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error("BASE_URL is not set");
  }

  const healthUrl = `${baseUrl}/healthcheck`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const startedAt = Date.now();

    try {
      const res = await fetch(healthUrl, { headers: wafBypassHeaders() });
      const event = {
        timestamp: new Date().toISOString(),
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        url: healthUrl,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        durationMs: Date.now() - startedAt,
        headers: responseHeaders(res),
        bodyPreview: await responseBodyPreview(res),
      };

      logHealthcheck(event);

      if (res.ok) {
        return;
      }
    } catch (err) {
      logHealthcheck({
        timestamp: new Date().toISOString(),
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        url: healthUrl,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: {
          name: err.name,
          message: err.message,
        },
      });
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }

  throw new Error(
    `Service at ${healthUrl} not ready after ${MAX_ATTEMPTS} attempts`,
  );
}
