import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test.describe("Find Commodity Page", () => {
  test("Validating the search function with goods name", async ({ page }) => {
    await new LoginPage("/find_commodity", page).login();
    await page
      .getByRole("combobox", { name: "Search the UK Integrated" })
      .click();
    await page
      .getByRole("combobox", { name: "Search the UK Integrated" })
      .fill("clothes");
    await page
      .getByRole("combobox", { name: "Search the UK Integrated" })
      .press("Enter");

    await expect(
      page.getByRole("heading", { name: "Results matching ‘clothes’" }),
    ).toBeVisible();
  });
});
