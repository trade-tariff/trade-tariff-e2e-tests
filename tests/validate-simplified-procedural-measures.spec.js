import { test, expect } from "@playwright/test";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";

test.describe("Simplified Procedural Measures", () => {
  test("allows switching between the by date and by code views", async ({
    page,
  }) => {
    await new BasicAuthLoginPage("/simplified_procedure_value", page).login();

    await page.selectOption("select", { index: 1 });
    await page
      .getByRole("button", { name: "View rates for selected date" })
      .click();

    await page.waitForSelector("tbody tr");
    const rowCount = await page.locator("tbody tr").count();
    expect(rowCount).toBeGreaterThan(0);

    await page.locator("tbody tr td a").first().click();

    await expect(page).toHaveURL(
      /\/simplified_procedure_value\?simplified_procedural_code=\d+\.\d+\.\d+/,
    );
  });
});
