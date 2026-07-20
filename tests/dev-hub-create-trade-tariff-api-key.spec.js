import DevHubLoginPage from "../pages/devHubLoginPage";
import { TradeTariffKeysPage } from "../pages/tradeTariffKeysPage";

import { test, expect } from "@playwright/test";

// Full Trade Tariff key lifecycle: log in, create a key (including intermediate
// success page with description, scopes, secret and token guidance), revoke it,
// delete it, sign out.
test("creating, revoking and deleting a trade tariff key", async ({ page }) => {
  if (process.env.SKIP_DEV_HUB === "true") {
    test.skip(
      "Skipping dev-hub test as per environment variable"
    );
    return;
  }

  const loginPage = new DevHubLoginPage(page);
  const tradeTariffKeysPage = new TradeTariffKeysPage(page);

  const keyDescription = `playwright-trade-tariff-${Date.now()}`;

  // 1. Log in
  await loginPage.login();

  // 2. Create a new Trade Tariff key and ensure the secret was captured
  await tradeTariffKeysPage.createKey(keyDescription);
  const storedSecret = tradeTariffKeysPage.getSecret(keyDescription);
  expect(
    storedSecret,
    "Trade Tariff client secret should be stored after create",
  ).not.toBeNull();

  // 3. Revoke the key
  await tradeTariffKeysPage.revokeKey(keyDescription);

  // 4. Delete the key and sign out
  await tradeTariffKeysPage.deleteKey(keyDescription);
  await loginPage.signOut();
});
