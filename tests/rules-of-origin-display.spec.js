import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test.describe("Rules of origin Display", () => {
  test("Verify Rules of Origin are displayed for selected commodity", async ({
    page,
  }) => {
    await new LoginPage("/commodities/0409000010", page).login();
    await page
      .getByRole("combobox", { name: "Select or enter a country" })
      .click();
    await page.getByRole("option", { name: "Albania (AL)" }).click();
    await page.getByRole("button", { name: "Set country" }).click();
    await page.getByRole("tab", { name: "Origin" }).click();

    await expect(
      page.getByRole("heading", {
        name: "Preferential rules of origin for trading with Albania Flag for Albania",
      }),
    ).toBeVisible();
  });
});
