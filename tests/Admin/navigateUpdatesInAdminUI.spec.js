import { test, expect, beforeEach } from "@playwright/test";
import { authenticator } from "otplib";

test.describe("admin login test", () => {
  test.describe.configure({mode: 'serial'});
  test.beforeEach(async ({ page }) => {
    const adminUrl = process.env.Playwright_ADMIN_URL;
    const username = process.env.Playwright_ADMIN_USERNAME;
    const password = process.env.Playwright_ADMIN_PASSWORD;
    const otpSecret = process.env.Playwright_ADMIN_OTP_SECRET;
    const token = authenticator.generate(otpSecret); // Generate the OTP token
    await page.goto(adminUrl);
    await page.getByRole("textbox", { name: "Email" }).fill(username);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("textbox", { name: "Code from app" }).fill(token);
    await page.getByRole("button", { name: "Sign in" }).click();
  });

  test("Validate UK updates", async ({ page }) => {
    await page.getByRole("listitem").filter({ hasText: "Updates" }).click();
    await expect(page.getByRole("heading", { name: "Tariff Updates - CDS" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Issue date" })).toBeVisible();
  });

  test("Validate XI updates", async ({ page }) => {
    await page.getByRole("link", { name: "Switch to XI service" }).click();
    await page.getByRole("listitem").filter({ hasText: "Updates" }).click();
    await expect(page.getByRole("heading", { name: "Tariff Updates - Taric" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Issue date" })).toBeVisible();
  });

});