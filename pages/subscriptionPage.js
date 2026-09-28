import CognitoUserCleaner from "../utils/cognitoUserCleaner.js";
import S3Lock from "../utils/s3Lock.js";
import PasswordlessLoginPage from "./passwordlessLoginPage.js";
import { expect } from "@playwright/test";

export default class SubscribePage {
  constructor(page) {
    this.page = page;
    this.email_address = process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL;
    this.locker = new S3Lock(
      process.env.PASSWORDLESS_SES_BUCKET,
      process.env.PASSWORDLESS_LOCK_KEY,
    );
    this.cleaner = new CognitoUserCleaner(
      process.env.PASSWORDLESS_POOL_NAME,
      process.env.AWS_DEFAULT_REGION,
    );
  }

  async start() {
    await this.cleaner.deleteUserByEmail(this.email_address);

    await new PasswordlessLoginPage(this.page, {
      startingURL: "/subscriptions/start",
    }).login();

    await expect(this.page.url()).toMatch("subscriptions");

    await this.click(this.stopPressWatchlistLink());
    await this.check(this.chapterPreferencesRadio());
    await this.click(this.continueButton());

    await this.check(this.liveAnimalsCheckbox());
    await this.click(this.continueButton());
    await expect(this.page.url()).toMatch(/stop_press\/check_your_answers/);
    await this.click(this.continueButton());
    await expect(this.page.url()).toMatch(/confirmation/);

    await this.click(this.viewWatchListsLink());
    await this.click(this.stopPressWatchlistLink());
    await this.click(this.unsubscribeLink());
    await this.click(this.unsubscribeSubmitButton());
    await expect(this.page.url()).toContain(
      "/subscriptions/unsubscribe/confirmation",
    );

    await this.fetcher.deleteEmail(this.email.s3_key);
    await this.cleaner.deleteUserByEmail(this.email_address);
  }

  async click(locator) {
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  async check(locator) {
    await locator.scrollIntoViewIfNeeded();
    await locator.check();
  }

  // Locators

  continueButton() {
    return this.page.getByRole("button", { name: "Continue" });
  }

  stopPressWatchlistLink() {
    return this.page.getByRole("link", {
      name: /stop press watch list/i,
    });
  }

  chapterPreferencesRadio() {
    return this.page.getByRole("radio", {
      name: "Select the tariff chapters I am interested in",
    });
  }

  liveAnimalsCheckbox() {
    return this.page.getByRole("checkbox", {
      name: "01 Live animals",
    });
  }

  unsubscribeLink() {
    return this.page.getByRole("link", {
      name: "Unsubscribe from all updates",
    });
  }

  unsubscribeSubmitButton() {
    return this.page.getByRole("button", {
      name: "Unsubscribe",
    });
  }

  viewWatchListsLink() {
    return this.page.getByRole("link", {
      name: "View your tariff watch lists",
    });
  }
}
