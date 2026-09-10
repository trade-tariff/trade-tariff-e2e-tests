import assert from "node:assert/strict";
import test from "node:test";

import LoginPage from "./loginPage.js";

function fakePage(passwordFieldVisible) {
  const events = [];

  const passwordField = {
    async isVisible() {
      return passwordFieldVisible;
    },
    async scrollIntoViewIfNeeded() {
      events.push(["scrollIntoViewIfNeeded"]);
    },
    async fill(value) {
      events.push(["fill", value]);
    },
    async waitFor(options) {
      events.push(["waitFor", options.state]);
    },
  };

  const page = {
    locator(selector) {
      assert.equal(selector, "#basic-session-password-field");
      return passwordField;
    },
    getByRole(role, options) {
      assert.equal(role, "button");
      assert.deepEqual(options, { name: "Continue" });
      return {
        async click() {
          events.push(["click"]);
        },
      };
    },
  };

  return { page, events };
}

function loginPageFor(page, password) {
  const loginPage = Object.create(LoginPage.prototype);
  loginPage.page = page;
  loginPage.password = password;
  return loginPage;
}

test("waits for the basic auth challenge to clear before returning", async () => {
  const { page, events } = fakePage(true);

  await loginPageFor(page, "secret").completeBasicAuth();

  assert.deepEqual(events, [
    ["scrollIntoViewIfNeeded"],
    ["fill", "secret"],
    ["click"],
    ["waitFor", "hidden"],
  ]);
});

test("does nothing when no basic auth challenge is shown", async () => {
  const { page, events } = fakePage(false);

  await loginPageFor(page, "secret").completeBasicAuth();

  assert.deepEqual(events, []);
});

test("fails clearly when the challenge is shown but no password is configured", async () => {
  const { page } = fakePage(true);

  await assert.rejects(
    () => loginPageFor(page, undefined).completeBasicAuth(),
    /BASIC_PASSWORD/,
  );
});
