import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test.describe("Simplified Procedural Measures", () => {
  test("allows switching between the by date and by code views", async ({
    page,
  }) => {
    await new LoginPage("/simplified_procedure_value", page).login();

    await page.selectOption("select", { index: 1 });
    await page
      .getByRole("button", { name: "View rates for selected date" })
      .click();

    const rowCount = await page.locator("tbody tr").count();
    expect(rowCount).toBeGreaterThan(0);

    await page.locator("tbody tr td a").first().click();

    await expect(page).toHaveURL(
      /\/simplified_procedure_value\?simplified_procedural_code=\d+\.\d+\.\d+/,
    );
  });
});
