import { test, expect } from "@playwright/test";

test.describe("Search References", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const isProduction = !!testInfo.project.use.baseURL.match(/www.trade-tariff.service.gov.uk/);
    const adminUrl = process.env.ADMIN_URL;
    const password = process.env.BASIC_PASSWORD;
    test.skip(isProduction, 'Skipping in production');
    await page.goto(adminUrl);
    await page.getByRole("textbox", { id: "basic-session-password-field" }).fill(password);
    await page.getByRole("button", { name: "Continue" }).click();
  });

test("displays UK section notes and allows chapter notes editing", async ({ page }) => {
await page.getByRole('link', { name: 'Section & chapter notes' }).click();
await expect(page.getByRole('heading', { name: 'Section Notes' })).toBeVisible();
await page.getByRole('link', { name: 'to 5' }).click();
await expect(page.getByRole('cell', { name: 'to 6' })).toBeVisible();
await page.getByRole('row', { name: '1 to 6 Live Animals Edit' }).getByRole('link').click();
await expect(page.getByRole('heading', { name: 'Edit Chapter Note' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Update Chapter note' })).toBeVisible();
await page.getByRole('link', { name: 'Back', exact: true }).click();
});

test("displays XI section notes and allows chapter notes editing", async ({ page,}) => {
  await page.getByRole("link", { name: "Switch to XI service" }).click();
  await page.getByRole("link", { name: "Section & chapter notes" }).click();
  await expect(page.getByRole("heading", { name: "Section Notes" })).toBeVisible();
  await page.getByRole("link", { name: "to 5" }).click();
  await expect(page.getByRole("cell", { name: "to 6" })).toBeVisible();
  await page.locator("#chapter_01").getByRole("cell", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit Chapter Note" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Update Chapter note" })).toBeVisible();
  await page.getByRole("link", { name: "Back", exact: true }).click();
});

 })