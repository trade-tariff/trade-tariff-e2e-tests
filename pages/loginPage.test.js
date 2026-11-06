import assert from "node:assert/strict";
import test from "node:test";

import LoginPage from "./loginPage.js";

function fakePage(options = {}) {
  const events = [];

  const passwordField = {
    async isVisible() {
      return options.passwordFieldVisible;
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

  const buttons = {
    Continue: {
      async click() {
        events.push(["click", "Continue"]);
      },
    },
    "Start now": {
      async isVisible() {
        return options.startNowVisible;
      },
      async click() {
        events.push(["click", "Start now"]);
      },
    },
  };

  const page = {
    locator(selector) {
      assert.equal(selector, "#basic-session-password-field");
      return passwordField;
    },
    getByRole(role, options) {
      assert.equal(role, "button");
      assert.ok(["Start now", "Continue"].includes(options.name));
      return buttons[options.name];
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
  const { page, events } = fakePage({
    passwordFieldVisible: true,
    startNowVisible: false,
  });

  await loginPageFor(page, "secret").completeBasicAuth();

  assert.deepEqual(events, [
    ["scrollIntoViewIfNeeded"],
    ["fill", "secret"],
    ["click", "Continue"],
    ["waitFor", "hidden"],
  ]);
});

test("does nothing when no basic auth challenge is shown", async () => {
  const { page, events } = fakePage({
    passwordFieldVisible: false,
    startNowVisible: false,
  });

  await loginPageFor(page, "secret").completeBasicAuth();

  assert.deepEqual(events, []);
});

test("fails clearly when the challenge is shown but no password is configured", async () => {
  const { page } = fakePage({
    passwordFieldVisible: true,
    startNowVisible: false,
  });

  await assert.rejects(
    () => loginPageFor(page, undefined).completeBasicAuth(),
    /BASIC_PASSWORD/,
  );
});

test("clicks 'Start now' if it is visible", async () => {
  const { page, events } = fakePage({
    passwordFieldVisible: false,
    startNowVisible: true,
  });

  await loginPageFor(page, "secret").completeBasicAuth();

  assert.deepEqual(events, [["click", "Start now"]]);
});

test("completes basic auth when a service has a 'Start now' page", async () => {
  const { page, events } = fakePage({
    passwordFieldVisible: true,
    startNowVisible: true,
  });

  await loginPageFor(page, "secret").completeBasicAuth();

  assert.deepEqual(events, [
    ["click", "Start now"],
    ["scrollIntoViewIfNeeded"],
    ["fill", "secret"],
    ["click", "Continue"],
    ["waitFor", "hidden"],
  ]);
});
