import path from "path";
import dotenv from "dotenv";

const playwrightEnv = process.env.PLAYWRIGHT_ENV ?? "development";
const envFile = path.resolve(__dirname, `.env.${playwrightEnv}`);
dotenv.config({ path: envFile });
dotenv.config({ path: ".env" });

const MAX_ATTEMPTS = 20;
const INTERVAL_MS = 5_000;

export default async function globalSetup() {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    throw new Error("BASE_URL is not set");
  }

  const healthUrl = `${baseUrl}/healthcheck`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(healthUrl);

      if (res.ok) {
        console.log(`Service ready at ${healthUrl} (attempt ${attempt})`);
        return;
      }

      console.log(
        `Health check returned ${res.status} (attempt ${attempt}/${MAX_ATTEMPTS})`,
      );
    } catch (err) {
      console.log(
        `Health check failed: ${err.message} (attempt ${attempt}/${MAX_ATTEMPTS})`,
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }

  throw new Error(
    `Service at ${healthUrl} not ready after ${MAX_ATTEMPTS} attempts`,
  );
}
