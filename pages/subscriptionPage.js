import CognitoUserCleaner from "../utils/cognitoUserCleaner.js";
import { expect } from "@playwright/test";

export default class SubscribePage {
  constructor(page) {
    this.page = page;
    this.emailAddress = process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL;
    this.cleaner = new CognitoUserCleaner(
      process.env.PASSWORDLESS_POOL_NAME,
      process.env.AWS_DEFAULT_REGION,
    );
  }

  async start() {
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

    if (!this.emailAddress) {
      console.warn(
        "PASSWORDLESS_SUBSCRIPTIONS_EMAIL not set, stale users may be in Cognito!",
      );
    } else {
      await this.cleaner.deleteUserByEmail(this.emailAddress);
    }
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
