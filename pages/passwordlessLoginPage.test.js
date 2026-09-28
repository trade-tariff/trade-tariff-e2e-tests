import assert from "node:assert/strict";
import test from "node:test";

import PasswordlessLoginPage from "./passwordlessLoginPage.js";

function loginPageFor(page = {}) {
  const loginPage = Object.create(PasswordlessLoginPage.prototype);
  loginPage.page = page;
  loginPage.email = undefined;
  loginPage.otpRequestedAt = new Date();
  return loginPage;
}

test("returns and deletes the first email received after the OTP request", async () => {
  const email = {
    code: "123456",
    s3_key: "inbound/message.json",
  };
  const requests = [];
  const deletedKeys = [];

  const loginPage = loginPageFor();
  loginPage.fetcher = {
    async getLatestEmail(options) {
      requests.push(options);
      return email;
    },
    async deleteEmail(key) {
      deletedKeys.push(key);
    },
  };

  const result = await loginPage.waitForEmail();

  assert.equal(result, email);
  assert.equal(loginPage.email, email);
  assert.deepEqual(requests, [{ notBefore: loginPage.otpRequestedAt }]);
  assert.deepEqual(deletedKeys, [email.s3_key]);
});

test("fails when the email does not contain an OTP code", async () => {
  const loginPage = loginPageFor();
  loginPage.email = {};

  await assert.rejects(() => loginPage.enterCodeFromEmail(), /OTP not found/);
});

test("fails when passwordless login throws up an error", async () => {
  const events = [];

  const errorContent = {
    async textContent() {
      events.push(["textContent"]);
      return "Something went wrong. Please try again.";
    },
  };

  const notificationBanner = {
    locator(selector) {
      assert.equal(selector, ".govuk-notification-banner__content");
      return errorContent;
    },
  };

  const loginPage = loginPageFor({
    getByRole(role, options) {
      assert.equal(role, "region");
      assert.deepEqual(options, { name: "Alert" });
      return notificationBanner;
    },
  });

  const message = (await loginPage.errorMessage()).trim();

  assert.equal(message, "Something went wrong. Please try again.");
  assert.deepEqual(events, [["textContent"]]);
});

test("enters the OTP code into the first digit field", async () => {
  const events = [];

  const loginPage = loginPageFor({
    locator(selector) {
      assert.equal(selector, 'input[aria-label="Digit 1 of 6"]');

      return {
        async click() {
          events.push(["click"]);
        },
        async pressSequentially(value) {
          events.push(["pressSequentially", value]);
        },
      };
    },
  });

  loginPage.email = { code: "123456" };

  await loginPage.enterCodeFromEmail();

  assert.deepEqual(events, [["click"], ["pressSequentially", "123456"]]);
});
