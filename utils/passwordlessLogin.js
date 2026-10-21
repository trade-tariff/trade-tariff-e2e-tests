import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

import PasswordlessLoginPage from "../pages/passwordlessLoginPage.js";

const authStatePath = path.resolve(
  import.meta.dirname,
  "../",
  "playwright",
  ".auth",
);
const authFile = path.join(authStatePath, "auth.json");

async function readAuthState() {
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

export default async function passwordlessLogin(url, { headers = {} } = {}) {
  const browser = await chromium.launch();

  try {
    const existing = await readAuthState();

    if (
      hasUnexpiredCookies(existing) &&
      (await isSessionValid(browser, existing, url, headers))
    ) {
      console.log("Existing auth state is valid, skipping passwordless login.");
      return;
    }

    console.log("No valid auth state found, logging in.");

    const context = await browser.newContext({
      baseURL: url,
      extraHTTPHeaders: headers,
    });

    try {
      const page = await context.newPage();

      await new PasswordlessLoginPage(page, { startingURL: url }).login();

      const state = await context.storageState();
      await fs.mkdir(authStatePath, { recursive: true });
      await fs.writeFile(authFile, JSON.stringify(state, null, 2));
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
