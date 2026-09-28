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

export default async function adminLogin(url, { headers = {} } = {}) {
  const browser = await chromium.launch();

  const context = await browser.newContext({
    baseURL: url,
    extraHTTPHeaders: headers,
  });

  try {
    const page = await context.newPage();

    await new PasswordlessLoginPage(page, {
      startingURL: url,
    }).login();

    const state = await context.storageState();

    await fs.mkdir(authStatePath, { recursive: true });

    await fs.writeFile(
      path.join(authStatePath, "admin.json"),
      JSON.stringify(state, null, 2),
    );
  } finally {
    await context.close();
    await browser.close();
  }
}
