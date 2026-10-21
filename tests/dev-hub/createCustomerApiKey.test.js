import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";
import DashboardPage from "../../pages/dashboardPage.js";
import ApiClient from "../../utils/apiClient.js";

const keyDescription = `playwright-${Date.now()}`;
const classificationOpts = {
  description: "jewelry case",
  expectFailure: false,
};
let dashboardPage;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  dashboardPage ?? new DashboardPage(page);
  await dashboardPage.revokeKey(keyDescription).catch(() => {});
  await dashboardPage.deleteKey(keyDescription).catch(() => {});
});

test("creating, using, and revoking a customer API key", async ({ page }) => {
  await new LoginPage(process.env.DEV_HUB_URL, page, true).login();
  dashboardPage = new DashboardPage(page);

  await dashboardPage.createKey(keyDescription);
  const storedKey = dashboardPage.getKey(keyDescription);
  expect(storedKey, "API key should be stored after create").not.toBeNull();

  const apiClient = new ApiClient(storedKey);
  await apiClient.doClassification(classificationOpts);
  apiClient.assertSuccessful();
  apiClient.assertClassification("420292");

  await dashboardPage.revokeKey(keyDescription);

  await apiClient.doClassification({
    ...classificationOpts,
    expectFailure: true,
  });
  apiClient.assertUnsuccessful();

  await dashboardPage.deleteKey(keyDescription);
});
