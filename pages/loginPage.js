import { test } from "@playwright/test";

import { isProductionEnvironment } from "../utils/environment.js";

export default class LoginPage {
  constructor(url, page, skipProduction = false) {
    this.page = page;

    this.isProduction = isProductionEnvironment();
    this.isAdmin = !!url.match(/admin/);
    this.url = url;
    this.password = process.env.BASIC_PASSWORD;
    this.skipProduction = skipProduction;
  }

  async login() {
    if (this.isProduction && this.skipProduction) {
      test.skip("Skipping in production");
      return;
    }

    await this.page.goto(this.url);

    await this.completeBasicAuth();
  }

  async completeBasicAuth() {
    const startNow = this.page.getByRole("button", { name: "Start now" });
    const passwordField = this.page.locator("#basic-session-password-field");

    if (await startNow.isVisible()) {
      await startNow.click();
    }

    if (!(await passwordField.isVisible())) {
      return;
    }

    if (!this.password) {
      throw new Error("BASIC_PASSWORD is required to sign in to this service");
    }

    await passwordField.scrollIntoViewIfNeeded();
    await passwordField.fill(this.password);
    await this.page.getByRole("button", { name: "Continue" }).click();

    // Clicking Continue does not wait for the resulting navigation, so without
    // this the caller can start asserting against the login page instead of
    // the page it asked for.
    await passwordField.waitFor({ state: "hidden" });
  }
}
