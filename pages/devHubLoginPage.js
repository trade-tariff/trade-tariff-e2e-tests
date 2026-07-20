import { expect } from "@playwright/test";

import EmailFetcher from "../utils/emailFetcher.js";
import S3Lock from "../utils/s3Lock.js";

export default class DevHubLoginPage {
  constructor(page) {
    this.page = page;
    this.fetcher = new EmailFetcher(
      DevHubLoginPage.PASSWORDLESS_SES_BUCKET,
      "inbound/",
    );
    this.locker = new S3Lock(
      DevHubLoginPage.PASSWORDLESS_SES_BUCKET,
      DevHubLoginPage.PASSWORDLESS_LOCK_KEY_FPO,
    );
  }

  static STARTING_URL =
    process.env.URL ?? "https://hub.dev.trade-tariff.service.gov.uk";
  static PASSWORDLESS_SUBSCRIPTIONS_EMAIL =
    process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL ?? "";
  static PASSWORDLESS_SES_BUCKET = process.env.PASSWORDLESS_SES_BUCKET ?? "";
  static PASSWORDLESS_LOCK_KEY_FPO =
    process.env.PASSWORDLESS_LOCK_KEY_FPO ?? "";
  static EMAIL_WAIT_MS = 20 * 1000;
  static EMAIL_POLL_MS = 1 * 1000;
  static TIMEOUT_MS = 15000;
  static ORG_URL_REGEX =
    /\/organisations\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async login() {
    this.requireEnvForLogin();
    await this.loginViaPasswordlessEmail();
    await this.page.waitForURL(DevHubLoginPage.ORG_URL_REGEX);
    expect(this.page.url()).toMatch(DevHubLoginPage.ORG_URL_REGEX);
    return this.page;
  }

  requireEnvForLogin() {
    const missing = [];
    if (!DevHubLoginPage.STARTING_URL) missing.push("URL");
    if (!DevHubLoginPage.PASSWORDLESS_SUBSCRIPTIONS_EMAIL)
      missing.push("PASSWORDLESS_SUBSCRIPTIONS_EMAIL");
    if (!DevHubLoginPage.PASSWORDLESS_SES_BUCKET)
      missing.push("PASSWORDLESS_SES_BUCKET");
    if (!DevHubLoginPage.PASSWORDLESS_LOCK_KEY_FPO)
      missing.push("PASSWORDLESS_LOCK_KEY_FPO ");
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for login: ${missing.join(", ")}. ` +
          "Set them in .env or .env.development / .env.staging (see README).",
      );
    }
  }

  async signOut() {
    await this.signOutLink().click();
    return this.page;
  }

  async loginViaPasswordlessEmail() {
    await this.page.goto(DevHubLoginPage.STARTING_URL);
    await this.startNowButton().waitFor({ state: "visible" });
    await this.startNowButton().click();
    await this.waitForLoginEntryPoint();
    await this.waitForEmailInput();
    this.assertOnLoginPage();

    await this.locker.withLock(async () => {
      const specificInput = this.page.locator(
        'input[name="passwordless_form[email]"]',
      );
      const emailInput =
        (await specificInput.count()) > 0
          ? specificInput
          : this.page.locator('input[type="email"]').first();

      await emailInput.fill(DevHubLoginPage.PASSWORDLESS_SUBSCRIPTIONS_EMAIL);
      await this.continueButton().click();
      await this.waitForEmail();
      await this.enterCodeFromEmail();
      await this.continueButton().click();
    });
  }

  assertOnLoginPage() {
    expect(this.page.url()).toContain("/login");
  }

  async waitForLoginEntryPoint() {
    const specificEmailInput = this.page.locator(
      'input[name="passwordless_form[email]"]',
    );
    const genericEmailInput = this.page.locator('input[type="email"]').first();

    await Promise.race([
      specificEmailInput.waitFor({
        state: "visible",
        timeout: DevHubLoginPage.TIMEOUT_MS,
      }),
      genericEmailInput.waitFor({
        state: "visible",
        timeout: DevHubLoginPage.TIMEOUT_MS,
      }),
      this.page.waitForURL(/\/dev\/login|\/login/, {
        timeout: DevHubLoginPage.TIMEOUT_MS,
      }),
    ]);
  }

  async waitForEmailInput() {
    const specificEmailInput = this.page.locator(
      'input[name="passwordless_form[email]"]',
    );
    const genericEmailInput = this.page.locator('input[type="email"]').first();
    await Promise.race([
      specificEmailInput.waitFor({
        state: "visible",
        timeout: DevHubLoginPage.TIMEOUT_MS,
      }),
      genericEmailInput.waitFor({
        state: "visible",
        timeout: DevHubLoginPage.TIMEOUT_MS,
      }),
    ]);
  }

  startNowButton() {
    return this.page.getByRole("button", { name: "Start now" });
  }

  continueButton() {
    return this.page.getByRole("button", { name: "Continue" });
  }

  signOutLink() {
    return this.page.getByRole("link", { name: "Sign Out" });
  }

  otpFirstDigitInput() {
    return this.page.locator('input[aria-label="Digit 1 of 6"]');
  }

  async waitForEmail() {
    const startTime = Date.now();

    while (Date.now() - startTime < DevHubLoginPage.EMAIL_WAIT_MS) {
      const email = await this.fetcher.getLatestEmail();

      if (
        email &&
        email.send_date > new Date(Date.now() - DevHubLoginPage.EMAIL_WAIT_MS)
      ) {
        this.email = email;
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, DevHubLoginPage.EMAIL_POLL_MS),
      );
    }
    if (this.email) return this.email;

    throw new Error(
      `No email received within ${DevHubLoginPage.EMAIL_WAIT_MS}ms`,
    );
  }

  async enterCodeFromEmail() {
    if (!this.email || !this.email.code) {
      throw new Error("No OTP code found");
    }

    const code = this.email.code;
    await this.otpFirstDigitInput().click();
    await this.otpFirstDigitInput().pressSequentially(code);
  }
}
