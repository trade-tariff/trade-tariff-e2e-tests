export async function createAuthenticatedState(browser, options) {
  if (!options.enabled) {
    return { cookies: [], origins: [] };
  }

  const context = await browser.newContext({
    baseURL: options.baseURL,
    extraHTTPHeaders: options.extraHTTPHeaders,
  });

  try {
    const page = await context.newPage();
    await page.goto(options.url);

    const passwordInput = page.locator("#basic-session-password-field");
    if ((await passwordInput.count()) > 0) {
      if (!options.password) {
        throw new Error("BASIC_PASSWORD is required for authenticated tests");
      }

      await passwordInput.fill(options.password);
      await page.getByRole("button", { name: "Continue" }).click();
    }

    return await context.storageState();
  } finally {
    await context.close();
  }
}
