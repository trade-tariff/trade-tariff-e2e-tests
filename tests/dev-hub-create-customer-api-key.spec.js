import DevHubLoginPage from "../pages/devHubLoginPage.js";
import DashboardPage from "../pages/dashboardPage.js";
import { ApiClient } from "../utils/apiClient.js";

import { test, expect } from "@playwright/test";

// Full journey: log in with passwordless email, create an API key, call the API,
// revoke the key, confirm the key no longer works, delete the key, sign out.
test("creating, using and revoking a customer api key", async ({ page }) => {
  if (process.env.SKIP_DEV_HUB === "true") {
    test.skip(
      "Skipping dev-hub test as per environment variable"
    );
    return;
  }

  const loginPage = new DevHubLoginPage(page);
  const dashboardPage = new DashboardPage(page);

  const keyDescription = `playwright-${Date.now()}`;
  const classificationOpts = {
    description: "jewelry case",
    expectFailure: false,
  };

  // 1. Log in
  await loginPage.login();

  // 2. Create a new API key and remember it
  await dashboardPage.createKey(keyDescription);
  const storedKey = dashboardPage.getKey(keyDescription);
  expect(storedKey, "API key should be stored after create").not.toBeNull();

  // 3. Call the classification API with the new key (expect success)
  const apiClient = new ApiClient(storedKey);
  await apiClient.doClassification(classificationOpts);
  apiClient.assertSuccessful();
  apiClient.assertClassification("420292");

  // 4. Revoke the key
  await dashboardPage.revokeKey(keyDescription);

  // 5. Call the API again; key should be rejected
  await apiClient.doClassification({
    ...classificationOpts,
    expectFailure: true,
  });
  apiClient.assertUnsuccessful();

  // 6. Delete the key and sign out
  await dashboardPage.deleteKey(keyDescription);
  await loginPage.signOut();
});
