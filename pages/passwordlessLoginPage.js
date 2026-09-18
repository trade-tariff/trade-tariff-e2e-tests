import { setTimeout as sleep } from "node:timers/promises";

import EmailFetcher from "../utils/emailFetcher.js";
import S3Lock from "../utils/s3Lock.js";

const EMAIL_POLL_DELAYS_MS = [250, 250, 500, 500, 1000];

export default class PasswordlessLoginPage {
  constructor(page, options = {}) {
    this.page = page;
    this.emailAddress =
      options.emailAddress ??
      process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL ??
      "";
    this.startingURL = options.startingURL ?? "";

    this.inboundBucket = process.env.PASSWORDLESS_SES_BUCKET ?? "";
    this.lockKey = process.env.PASSWORDLESS_LOCK_KEY ?? "";
    this.awsRegion = process.env.AWS_DEFAULT_REGION ?? "eu-west-2";

    this.email = undefined;

    this.fetcher = new EmailFetcher(this.inboundBucket, "inbound/");

    this.locker = new S3Lock(this.inboundBucket, this.lockKey, this.awsRegion);
  }

  async login() {
    await this.locker.withLock(async () => {
      this.otpRequestedAt = new Date();

      await this.page.goto(this.startingURL);
      await this.startButton().click();
      await this.emailInput().fill(this.emailAddress);

      await this.continueButton().click();

      await this.waitForEmail();
      await this.enterCodeFromEmail();

      await this.continueButton().click();
    });

    return this.page;
  }

  async waitForEmail() {
    const timeoutMs = 20_000;
    const startedAt = Date.now();

    let poll = 0;

    while (Date.now() - startedAt < timeoutMs) {
      const email = await this.fetcher.getLatestEmail({
        notBeforeTimestamp: this.otpRequestedAt,
      });

      if (email) {
        this.email = email;
        this.fetcher.deleteEmail(this.email.s3_key);
        return email;
      }

      const delay =
        EMAIL_POLL_DELAYS_MS[Math.min(poll, EMAIL_POLL_DELAYS_MS.length - 1)];

      await sleep(delay);
      poll += 1;
    }

    throw new Error(`No email received within ${timeoutMs}ms`);
  }

  async enterCodeFromEmail() {
    const code = this.email.code;

    if (!code) {
      throw new Error("OTP not found");
    }

    await this.otpFirstDigitInput().click();
    await this.otpFirstDigitInput().pressSequentially(code);
  }

  startButton() {
    return this.page.getByRole("button", { name: "Start now" });
  }

  continueButton() {
    return this.page.getByRole("button", { name: "Continue" });
  }

  emailInput() {
    return this.page.locator('input[name="passwordless_form[email]"]');
  }

  otpFirstDigitInput() {
    return this.page.locator('input[aria-label="Digit 1 of 6"]');
  }
}
