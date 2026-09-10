import { test, expect } from "../fixtures.js";
import SubscriptionPage from "../pages/subscriptionPage.js";
import LoginPage from "../pages/loginPage.js";
import { isProductionEnvironment } from "../utils/environment.js";

test.describe("MyOTT Subscription Flow E2E Test", () => {
  test("should complete passwordless subscription and unsubscription", async ({
    page,
  }) => {
    if (isProductionEnvironment()) {
      test.skip("Skipping in production environment");
      return;
    }

    const skipPasswordlessVerification =
      process.env.SKIP_PASSWORDLESS_VERIFICATION === "true";

    if (skipPasswordlessVerification) {
      test.skip("Skipping passwordless verification");
      return;
    }

    await new LoginPage("/subscriptions/start", page).login();
    const subscribePage = new SubscriptionPage(page);

    await subscribePage.start();

    await expect(page).toHaveURL(/\/subscriptions\/unsubscribe\/confirmation/);
  });
});
