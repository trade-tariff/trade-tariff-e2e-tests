import { test } from "@playwright/test";

export default class LoginPage {
  constructor(url, page, skipProduction = false) {
    this.page = page;

    this.isProduction = !!process.env.BASE_URL.match(/www\.trade-tariff\.service\.gov\.uk/);
    this.isAdmin = !!url.match(/admin/);
    this.isFrontend = !!url.startsWith('/');
    this.url = url;
    this.password = process.env.BASIC_PASSWORD;
    this.skipProduction = skipProduction;
    this.skipAdmin = process.env.SKIP_ADMIN === 'true';
    this.skipFrontend = process.env.SKIP_FRONTEND === 'true';
  }

  async login() {
    if (this.isProduction && this.skipProduction) {
      test.skip('Skipping in production');
      return;
    }

    if (this.isAdmin && this.skipAdmin) {
      test.skip('Skipping admin test');
      return;
    }

    if (this.isFrontend && this.skipFrontend) {
      test.skip('Skipping frontend test');
      return;
    }

    await this.page.goto(this.url);

    const loginLocator = this.page.locator('#basic-session-password-field');

    if (await loginLocator.count() > 0) {
      await loginLocator.scrollIntoViewIfNeeded();
      await loginLocator.fill(this.password);
      await this.page.getByRole("button", { name: "Continue" }).click();
    }
  }
}
