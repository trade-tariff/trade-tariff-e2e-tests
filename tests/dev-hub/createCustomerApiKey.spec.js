import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";
import KeysPage from "../../pages/keysPage.js";
import ApiClient from "../../utils/apiClient.js";

const keyDescription = `playwright-${Date.now()}`;
const classificationOpts = {
  description: "jewelry case",
  expectFailure: false,
};
let keysPage;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  keysPage ??= new KeysPage(page);
  await keysPage.fpoKeysTabLink().click();
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

test("creating, using, and revoking an FPO API key", async ({ page }) => {
  await new LoginPage(process.env.DEV_HUB_URL, page, true).login();
  keysPage = new KeysPage(page);
  await keysPage.fpoKeysTabLink().click();

  await keysPage.createKey(keyDescription);
  const storedKey = keysPage.getSecret(keyDescription);
  expect(storedKey, "API key should be stored after create").not.toBeNull();

  const apiClient = new ApiClient(storedKey);
  await apiClient.doClassification(classificationOpts);
  apiClient.assertSuccessful();
  apiClient.assertClassification("420292");

  await keysPage.revokeKey(keyDescription);

  await apiClient.doClassification({
    ...classificationOpts,
    expectFailure: true,
  });
  apiClient.assertUnsuccessful();

  await keysPage.deleteKey(keyDescription);
});
