const { test, expect } = require("@playwright/test");

test.describe("Tariff Duty Calculator End -to -End Test", () => {
  test("Validating the duty calculator Workflow", async ({ page }) => {
    await page.goto("/commodities/0702001007");
    await page.getByRole("link", { name: "work out the duties and taxes" }).click();
    await expect(page.getByText("Calculate import duties")).toBeVisible();
  });
});
