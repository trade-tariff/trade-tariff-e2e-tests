import { test, expect } from "../../fixtures.js";
import LoginPage from "../../pages/loginPage.js";

test.describe("Duty Calculator Integration", () => {
  test("Validating the duty calculator", async ({ page }) => {
    await new LoginPage("/commodities/0702001007", page).login();
    await page.getByRole("link", { name: "Start a duty calculation" }).click();

    const importDetails = page.getByRole("heading", {
      name: "Tell us about this import",
    });
    const legacyImportDate = page.getByRole("heading", {
      name: "When will the goods be imported?",
    });
    await expect(importDetails.or(legacyImportDate)).toBeVisible();

    if (await importDetails.isVisible()) {
      await completeStandardImportDetails(page);
    } else {
      await completeLegacyImportSteps(page);
    }

    const customsValue = page.getByRole("textbox", {
      name: /value of goods being imported|value in GBP of/i,
    });
    await customsValue.click();
    await customsValue.fill("1000");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", {
        name: "Do you have any of the following documents?",
      }),
    ).toBeVisible();
    await page.getByRole("radio", { name: "None of the above" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    const legacyCalculate = page.getByRole("link", {
      name: "Calculate import duties",
    });
    const standardContinue = page
      .getByRole("main")
      .getByRole("link", { name: "Continue" });
    await expect(legacyCalculate.or(standardContinue)).toBeVisible();

    if (await legacyCalculate.isVisible()) {
      await legacyCalculate.click();
      await expect(
        page.getByRole("heading", { name: "Option 1: Third-country duty" }),
      ).toBeVisible();
      return;
    }

    await standardContinue.click();
    await expect(
      page.getByRole("heading", { name: "Import cost estimate" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Estimated duty and VAT using standard duty",
      }),
    ).toBeVisible();
  });
});

async function completeStandardImportDetails(page) {
  await page
    .getByRole("radio", { name: "England, Scotland or Wales (GB)" })
    .check();

  await page
    .locator(
      "//input[@id='duty-calculator-steps-import-details-country-of-origin-field']",
    )
    .click();
  const origin = page.getByRole("combobox", {
    name: "What is the country of origin?",
  });
  await origin.fill("Canada");
  await origin.press("Enter");
  await page.getByRole("button", { name: "Continue" }).click();
}

async function completeLegacyImportSteps(page) {
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("radio", { name: "England, Scotland or Wales (" })
    .check();
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .locator(
      "//input[@id='duty-calculator-steps-country-of-origin-country-of-origin-field']",
    )
    .click();
  const origin = page.getByRole("combobox", {
    name: "Where are the goods coming",
  });
  await origin.fill("Canada");
  await origin.press("Enter");
  await page.getByRole("button", { name: "Continue" }).click();
}
