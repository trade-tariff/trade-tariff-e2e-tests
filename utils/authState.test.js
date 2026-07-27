import assert from "node:assert/strict";
import test from "node:test";

import { createAuthenticatedState } from "./authState.js";

test("returns empty state without opening a browser when auth is disabled", async () => {
  const browser = {
    newContext() {
      throw new Error("browser context should not be created");
    },
  };

  const state = await createAuthenticatedState(browser, { enabled: false });

  assert.deepEqual(state, { cookies: [], origins: [] });
});

test("authenticates once and returns reusable storage state", async () => {
  const events = [];
  const expectedState = {
    cookies: [{ name: "session", value: "authenticated" }],
    origins: [],
  };
  const page = {
    async goto(url) {
      events.push(["goto", url]);
    },
    locator(selector) {
      assert.equal(selector, "#basic-session-password-field");
      return {
        async count() {
          return 1;
        },
        async fill(password) {
          events.push(["fill", password]);
        },
      };
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
  const context = {
    async newPage() {
      return page;
    },
    async storageState() {
      events.push(["storageState"]);
      return expectedState;
    },
    async close() {
      events.push(["close"]);
    },
  };
  const browser = {
    async newContext(options) {
      events.push(["newContext", options]);
      return context;
    },
  };

  const state = await createAuthenticatedState(browser, {
    enabled: true,
    baseURL: "https://example.test",
    url: "/find_commodity",
    password: "secret",
    extraHTTPHeaders: { "x-waf-bypass": "token" },
  });

  assert.deepEqual(state, expectedState);
  assert.deepEqual(events, [
    [
      "newContext",
      {
        baseURL: "https://example.test",
        extraHTTPHeaders: { "x-waf-bypass": "token" },
      },
    ],
    ["goto", "/find_commodity"],
    ["fill", "secret"],
    ["click"],
    ["storageState"],
    ["close"],
  ]);
});
