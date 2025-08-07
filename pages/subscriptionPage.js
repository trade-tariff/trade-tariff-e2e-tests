import CognitoUserCleaner from '../utils/cognitoUserCleaner.js';
import EmailFetcher from '../utils/emailFetcher.js';
import S3Lock from '../utils/s3Lock.js';

import { expect } from '@playwright/test';

export default class SubscribePage {
  constructor(page) {
    this.page = page;
    this.email_address = process.env.PASSWORDLESS_SUBSCRIPTIONS_EMAIL
    this.fetcher = new EmailFetcher(process.env.PASSWORDLESS_SES_BUCKET, 'inbound/');
    this.locker = new S3Lock(process.env.PASSWORDLESS_SES_BUCKET, process.env.PASSWORDLESS_LOCK_KEY);
    this.cleaner = new CognitoUserCleaner(process.env.PASSWORDLESS_POOL_NAME, process.env.AWS_DEFAULT_REGION);
  }

  async start() {
    // Acquire lock to ensure no other tests are running concurrently
    await this.locker.withLock(async () => {
      await this.cleaner.deleteUserByEmail(this.email_address);

      // Sleep 1 second to ensure the user is deleted before proceeding
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate through subscription verification flow
      await this.click(this.startNowButton());
      await this.emailInput().fill(this.email_address);
      await this.click(this.continueButton());
      await this.waitForEmail();
      await this.verifyPasswordlessLinkFromEmail();
      expect(this.page.url()).toContain('/subscriptions/preferences/new')

      // Signed in, we can now set preferences
      await this.chapterPreferencesRadio().check();
      await this.click(this.continueButton());
      await this.liveAnimalsCheckbox().check();
      await this.click(this.continueButton());
      expect(this.page.url()).toContain('/subscriptions/check_your_answers');
      await this.click(this.continueButton());
      expect(this.page.url()).toContain('/subscriptions/confirmation');

      // And unsubscribe
      await this.page.goto('/subscriptions');
      await this.unsubscribeLink().click();
      await this.unsubscribeSubmitButton().click();
      expect(this.page.url()).toContain('/subscriptions/unsubscribe/confirmation');

      await this.fetcher.deleteEmail(this.email.s3_key);
      await this.cleaner.deleteUserByEmail(this.email_address);
    });
  }

  async waitForEmail() {
    const timeout = 20 * 1000;

    this.startTime = Date.now();
    this.email = undefined;

    while (Date.now() - this.startTime < timeout) {
      const email = await this.fetcher.getLatestEmail();

      if (email && email.send_date > new Date(Date.now() - timeout)) {
        this.email = email;
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1 * 1000));
    }
    if (this.email) return this.email

    throw new Error('No email received within the timeout period');
  }

  async verifyPasswordlessLinkFromEmail() {
    if (!this.email || !this.email.whitelistedLinks || this.email.whitelistedLinks.length === 0) {
      throw new Error('No valid email links found');
    }

    const link = this.email.whitelistedLinks[0];
    await this.page.goto(link);
  }

  async click(locator) {
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  // Locators

  startNowButton() {
    return this.page.getByRole('button', { name: 'Start now' })
  }

  emailInput() {
    return this.page.locator('input[name="passwordless_form[email]"]')
  }

  continueButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  chapterPreferencesRadio() {
    return this.page.getByLabel('Select the tariff chapters I am interested in')
  }

  liveAnimalsCheckbox() {
    return this.page.getByLabel('Live animals')
  }

  unsubscribeLink() {
    return this.page.getByRole('link', { name: 'Unsubscribe from all updates' });
  }

  unsubscribeSubmitButton() {
    return this.page.getByRole('button', { name: 'Unsubscribe' });
  }
}
