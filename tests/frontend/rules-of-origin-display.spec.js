import { test, expect } from "../../fixtures.js";
import LoginPage from "../../pages/loginPage.js";

test.describe("Rules of origin Display", () => {
  test("Verify Rules of Origin are displayed for selected commodity", async ({
    page,
  }) => {
    await new LoginPage("/commodities/0409000010", page).login();
    await page
      .getByRole("combobox", {
        name: "Where were the goods produced or coming from?",
      })
      .click();
    await page.getByRole("option", { name: "Albania (AL)" }).click();
    await page.getByRole("button", { name: "Update page" }).click();
    await page.getByRole("tab", { name: "Origin" }).click();

    await expect(
      page.getByRole("heading", {
        name: "Preferential rules of origin for trading with Albania Flag for Albania",
      }),
    ).toBeVisible();
  });
});
