import { test } from "@playwright/test";

export default class LoginPage {
  constructor(url, page, skipProduction = false) {
    this.page = page;

    this.isProduction = !!process.env.BASE_URL.match(
      /www\.trade-tariff\.service\.gov\.uk/,
    );
    this.isAdmin = !!url.match(/admin/);
    this.isFrontend = !!url.startsWith("/");
    this.url = url;
    this.password = process.env.BASIC_PASSWORD;
    this.skipProduction = skipProduction;
    this.skipAdmin = process.env.SKIP_ADMIN === "true";
    this.skipFrontend = process.env.SKIP_FRONTEND === "true";
  }

  async login() {
    if (this.isProduction && this.skipProduction) {
      test.skip("Skipping in production");
      return;
    }

    if (this.isAdmin && this.skipAdmin) {
      test.skip("Skipping admin test");
      return;
    }

    if (this.isFrontend && this.skipFrontend) {
      test.skip("Skipping frontend test");
      return;
    }

    await this.page.goto(this.url);

    await this.completeBasicAuth();
  }

  async completeBasicAuth() {
    const passwordField = this.page.locator("#basic-session-password-field");

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
