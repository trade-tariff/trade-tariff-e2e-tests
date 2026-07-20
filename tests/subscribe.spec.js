import { test, expect } from "@playwright/test";
import SubscriptionPage from "../pages/subscriptionPage.js";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";

test.describe("MyOTT Subscription Flow E2E Test", () => {
  test("should complete passwordless subscription and unsubscription", async ({
    page,
  }) => {
    const isProduction = !!process.env.BASE_URL.match(
      /www\.trade-tariff\.service\.gov\.uk/,
    );

    if (isProduction) {
      test.skip("Skipping in production environment");
      return;
    }

    const skipPasswordlessVerification =
      process.env.SKIP_PASSWORDLESS_VERIFICATION === "true";

    if (skipPasswordlessVerification) {
      test.skip("Skipping passwordless verification");
      return;
    }

    await new BasicAuthLoginPage("/subscriptions/start", page).login();
    const subscribePage = new SubscriptionPage(page);

    await subscribePage.start();

    await expect(page).toHaveURL(/\/subscriptions\/unsubscribe\/confirmation/);
  });
});
