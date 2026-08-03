import DashboardPage from "../pages/dashboardPage.js";
import { ApiClient } from "../utils/apiClient.js";

import { devHubTest as test, expect } from "../fixtures.js";

// Full journey: log in with passwordless email, create an API key, call the API,
// revoke the key, confirm the key no longer works, delete the key, sign out.

test.describe("Dev hub API keys", () => {
  test("creating, using and revoking a customer api key", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    const keyDescription = `playwright-${Date.now()}`;
    const classificationOpts = {
      description: "jewelry case",
      expectFailure: false,
    };

    // Create a new API key and remember it
    await dashboardPage.createKey(keyDescription);
    const storedKey = dashboardPage.getKey(keyDescription);
    expect(storedKey, "API key should be stored after create").not.toBeNull();

    // Call the classification API with the new key (expect success)
    const apiClient = new ApiClient(storedKey);
    await apiClient.doClassification(classificationOpts);
    apiClient.assertSuccessful();
    apiClient.assertClassification("420292");

    // Revoke the key
    await dashboardPage.revokeKey(keyDescription);

    // Call the API again; key should be rejected
    await apiClient.doClassification({
      ...classificationOpts,
      expectFailure: true,
    });
    apiClient.assertUnsuccessful();

    // Delete the key
    await dashboardPage.deleteKey(keyDescription);
  });
});
