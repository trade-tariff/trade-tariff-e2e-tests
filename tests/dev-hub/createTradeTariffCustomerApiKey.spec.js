import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";
import TradeTariffKeysPage from "../../pages/keysPage.js";

const keyDescription = `playwright-trade-tariff-${Date.now()}`;

test("creating, revoking and deleting a trade tariff key", async ({ page }) => {
  await new LoginPage(process.env.DEV_HUB_URL, page, true).login();
  const tradeTariffKeysPage = new TradeTariffKeysPage(page);

  await tradeTariffKeysPage.createKey(keyDescription);
  const storedSecret = tradeTariffKeysPage.getSecret(keyDescription);
  expect(
    storedSecret,
    "Trade Tariff client secret should be stored after create",
  ).not.toBeNull();

  await tradeTariffKeysPage.revokeKey(keyDescription);

  await tradeTariffKeysPage.deleteKey(keyDescription);
});
