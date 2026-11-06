import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";

test.describe("Admin updates", () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(process.env.ADMIN_URL, page, true).login();
    await page.getByRole("link", { name: "Updates", exact: true }).click();
  });

  test("Validate UK updates", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Tariff Updates - CDS" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Review inserts" }).first().click();

    await expect(page.getByText("Records changed")).toBeVisible();
    await expect(page.getByRole("link", { name: "Download" })).toBeVisible();
  });

  test("Validate XI updates", async ({ page }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();

    await expect(
      page.getByRole("heading", { name: "Tariff Updates - Taric" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Review inserts" }).first().click();

    await expect(page.getByText("Records changed")).toBeVisible();
    await expect(page.getByRole("link", { name: "Download" })).toBeVisible();
  });
});
