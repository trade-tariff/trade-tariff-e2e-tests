import path from "path";
import dotenv from "dotenv";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";
import { waitUntilReady } from "./utils/waitUntilReady.js";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`);
dotenv.config({ path: envFile });
dotenv.config({ path: ".env" });

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

async function logAttempt(event) {
  const { res, error, ...rest } = event;

  logHealthcheck({
    timestamp: new Date().toISOString(),
    ...rest,
    ...(res && {
      headers: responseHeaders(res),
      bodyPreview: await responseBodyPreview(res),
    }),
    ...(error && { error: { name: error.name, message: error.message } }),
  });
}

export default async function globalSetup() {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error("BASE_URL is not set");
  }

  // The shallow /healthcheck only proves the frontend process itself is up.
  // It can pass while a backend dependency (e.g. mid ECS rolling-deploy) is
  // still returning 5xx, which previously surfaced as a burst of unrelated
  // test timeouts across the suite rather than a clear setup failure.
  // Polling a real backend-dependent endpoint too closes that gap.
  await waitUntilReady(`${baseUrl}/healthcheck`, {
    headers: wafBypassHeaders(),
    onAttempt: logAttempt,
  });

  await waitUntilReady(`${baseUrl}/uk/api/news/items`, {
    headers: wafBypassHeaders(),
    onAttempt: logAttempt,
  });
}
