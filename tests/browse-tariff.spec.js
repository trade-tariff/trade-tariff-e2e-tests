import { test, expect } from "@playwright/test";
import BasicAuthLoginPage from "../pages/basicAuthLoginPage.js";

test.describe("Browse Page", () => {
  test("Validating browsing the tariff", async ({ page }) => {
    await new BasicAuthLoginPage("/browse", page).login();

    await page.getByRole("link", { name: "Section 1: Live animals;" }).click();
    await page.getByRole("link", { name: "Chapter 01: Live animals" }).click();
    await page.getByRole("link", { name: "Heading 01: Live horses," }).click();
    await page
      .getByRole("link", { name: "Commodity code 0101210000," })
      .click();

    await expect(
      page.getByLabel("Breadcrumb").getByText("Commodity"),
    ).toBeVisible();
  });
});
