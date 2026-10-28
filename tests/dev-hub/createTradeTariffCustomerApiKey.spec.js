import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";
import TradeTariffKeysPage from "../../pages/keysPage.js";

const keyDescription = `playwright-trade-tariff-${Date.now()}`;
let keysPage;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  keysPage ??= new TradeTariffKeysPage(page);
  await keysPage
    .revokeKey(keyDescription)
    .catch((error) =>
      console.warn(`Cleanup could not revoke ${keyDescription}:`, error),
    );
  await keysPage
    .deleteKey(keyDescription)
    .catch((error) =>
      console.warn(`Cleanup could not delete ${keyDescription}:`, error),
    );
});

test("creating, revoking and deleting a trade tariff key", async ({ page }) => {
  await new LoginPage(process.env.DEV_HUB_URL, page, true).login();
  keysPage = new TradeTariffKeysPage(page);

  await keysPage.createKey(keyDescription);
  const storedSecret = keysPage.getSecret(keyDescription);
  expect(
    storedSecret,
    "Trade Tariff client secret should be stored after create",
  ).not.toBeNull();

  await keysPage.revokeKey(keyDescription);

  await keysPage.deleteKey(keyDescription);
});
