import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";

test.describe("News Items", () => {
  test.beforeEach(
    async ({ page }) => {
      await new LoginPage(process.env.ADMIN_URL, page, true).login();
      await page.getByRole("link", { name: "News" }).click();
    }
  );

  test("should display current news stories table", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: "Start date" }),
    ).toBeVisible();
  });

  test("new news story form", async ({ page }) => {
    await page.getByRole("link", { name: "Add a News story" }).click();

    const precisInput = page.getByRole("textbox", { name: "Precis" });
    await expect(precisInput).toBeVisible();

    await precisInput.fill("Chapter: 99")
    const precisPreviewText = page.locator('div.hott-markdown-preview[data-preview-for="#news-item-precis-field"] p').innerText();
    await expect(precisPreviewText).toBeVisible();
  });
})
