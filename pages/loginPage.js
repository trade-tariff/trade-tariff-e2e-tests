import { test } from "@playwright/test";

export default class LoginPage {
  constructor(url, page, testInfo, skipProduction = false) {
    this.page = page;
    this.isProduction = !!testInfo.project.use.baseURL.match(/www.trade-tariff.service.gov.uk/);
    this.url = url;
    this.password = process.env.BASIC_PASSWORD;
    this.skipProduction = skipProduction;
  }

  async login() {
    if (this.isProduction && this.skipProduction) {
      test.skip('Skipping in production');
      return;
    }

    await this.page.goto(this.url);

    const loginLocator = this.page.locator('#basic-session-password-field');

    if (await loginLocator.count() > 0) {
      await loginLocator.fill(this.password);
      await this.page.getByRole("button", { name: "Continue" }).click();
    }
  }
}
