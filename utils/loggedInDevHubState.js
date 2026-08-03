import DevHubLoginPage from "../pages/devHubLoginPage.js";

export async function createIdentityAuthenticatedState(browser, options) {
  if (!options.enabled) {
    return { cookies: [], origins: [] };
  }

  const context = await browser.newContext({
    baseURL: options.baseURL,
    extraHTTPHeaders: options.extraHTTPHeaders,
  });

  try {
    const page = await context.newPage();
    const loginPage = new DevHubLoginPage(page);
    await loginPage.login();

    return await context.storageState();
  } finally {
    await context.close();
  }
}
