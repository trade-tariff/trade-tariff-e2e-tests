import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";
import SubscriptionPage from "../../pages/subscriptionPage.js";

test.describe("Stop Press watchlist", () => {
  test("should complete passwordless subscription and unsubscription", async ({
    page,
  }) => {
    await new LoginPage(process.env.MYOTT_URL, page, true).login();
    const subscribePage = new SubscriptionPage(page);

    await subscribePage.start();

    await expect(page).toHaveURL(/\/subscriptions\/unsubscribe\/confirmation/);
  });
});
