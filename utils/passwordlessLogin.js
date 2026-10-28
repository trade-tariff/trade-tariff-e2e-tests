import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

import PasswordlessLoginPage from "../pages/passwordlessLoginPage.js";
import { authFileFor } from "./projectArgs.js";

const root = path.resolve(import.meta.dirname, "../");
const LOGIN_ACTION_TIMEOUT_MS = 10_000;

async function readAuthState(authFile) {
  try {
    return JSON.parse(await fs.readFile(authFile, "utf-8"));
  } catch {
    return null;
  }
}

function hasUnexpiredCookies(state) {
  const cookies = state?.cookies ?? [];
  if (cookies.length === 0) return false;

  const now = Date.now() / 1000;
  // expires === -1 is a session cookie
  return cookies.some((c) => c.expires === -1 || c.expires > now);
}

async function isSessionValid(browser, state, url, headers) {
  const context = await browser.newContext({
    baseURL: url,
    extraHTTPHeaders: headers,
    storageState: state,
  });

  try {
    const page = await context.newPage();
    await page.goto(url);

    const signOutLink = page.getByRole("link", { name: "Sign out" });
    const emailInput = page.getByRole("textbox", { name: "Email" });

    return (await signOutLink.isVisible()) && !(await emailInput.isVisible());
  } catch (error) {
    console.warn("Could not verify existing auth state:", error);
    return false;
  } finally {
    await context.close();
  }
}

export default async function passwordlessLogin(
  name,
  url,
  { headers = {}, signedInText } = {},
) {
  const authFile = path.join(root, authFileFor(name));
  const browser = await chromium.launch();

  try {
    const existing = await readAuthState(authFile);

    if (
      hasUnexpiredCookies(existing) &&
      (await isSessionValid(browser, existing, url, headers))
    ) {
      console.log(
        `[${name}] existing auth state is valid, skipping passwordless login.`,
      );
      return;
    }

    console.log(`[${name}] no valid auth state found, logging in.`);

    const context = await browser.newContext({
      baseURL: url,
      extraHTTPHeaders: headers,
    });
    // Outside the test runner, actions have no timeout. Keep the whole login
    // shorter than the S3 lock's stale timeout so the lock is not reaped.
    context.setDefaultTimeout(LOGIN_ACTION_TIMEOUT_MS);

    try {
      const page = await context.newPage();
      await new PasswordlessLoginPage(page, {
        startingURL: url,
        signedInText,
      }).login();

      await fs.mkdir(path.dirname(authFile), { recursive: true });
      await context.storageState({ path: authFile });
    } catch (error) {
      console.error("Could not log in:", error);
      throw error;
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
