import { test } from "@playwright/test";

export default class LoginPage {
  constructor(page, testInfo) {
    this.page = page;
    this.isProduction = !!testInfo.project.use.baseURL.match(/www.trade-tariff.service.gov.uk/);
    this.adminUrl = process.env.ADMIN_URL;
    this.password = process.env.BASIC_PASSWORD;
  }

  async login() {
    if (this.isProduction) {
      test.skip('Skipping in production');
    } else {
      await this.page.goto(this.adminUrl);

      await this.page.getByRole(
        "textbox",
        { id: "basic-session-password-field" }
      ).fill(this.password);

      await this.page.getByRole("button", { name: "Continue" }).click();
    }
  }
}
