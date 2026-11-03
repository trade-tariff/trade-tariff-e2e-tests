import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/loginPage.js";

test.describe("Notes", () => {
  test.beforeEach(
    async ({ page }) =>
      await new LoginPage(process.env.ADMIN_URL, page, true).login(),
  );

  for (const service of ["UK", "XI"]) {
    test(`displays ${service} versioned notes and opens the chapter note editor`, async ({
      page,
    }) => {
      if (service === "XI") {
        await page.getByRole("link", { name: "Switch to XI service" }).click();
      }

      await expect(
        page.getByRole("link", {
          name: `Switch to ${service === "UK" ? "XI" : "UK"} service`,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "Customs Tariff Updates",
          exact: true,
        }),
      ).toBeVisible();

      await page
        .getByRole("link", { name: "Review", exact: true })
        .first()
        .click();

      await expect(page.locator("#compare_version")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Section Notes", exact: true }),
      ).toBeVisible();

      await page
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", { name: "Section 1", exact: true }),
        })
        .getByRole("cell")
        .last()
        .getByRole("link")
        .click();

      await expect(
        page.getByRole("heading", { name: /^Chapter Notes/ }),
      ).toBeVisible();

      const noteAction = page
        .getByRole("row")
        .filter({ has: page.getByRole("cell", { name: "01", exact: true }) })
        .getByRole("link", { name: /^(View\/Edit|View diff)$/ });
      const actionName = await noteAction.innerText();
      await noteAction.click();

      if (actionName === "View diff") {
        await page
          .getByRole("link", { name: "Edit this note", exact: true })
          .click();
      }

      await expect(
        page.getByRole("heading", {
          name: "Edit Chapter 01 Note",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Content", exact: true }),
      ).toBeEditable();
      await expect(
        page.getByRole("button", { name: "Save", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Preview", exact: true }),
      ).toBeVisible();

      await page.getByRole("link", { name: "Cancel", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: /^Chapter Notes/ }),
      ).toBeVisible();
    });
  }
});
