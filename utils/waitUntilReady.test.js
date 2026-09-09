import assert from "node:assert/strict";
import test from "node:test";

import { waitUntilReady } from "./waitUntilReady.js";

function fakeResponse(ok) {
  return {
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? "OK" : "Service Unavailable",
  };
}

test("returns as soon as the endpoint responds ok", async () => {
  let calls = 0;
  await waitUntilReady("https://example.test/healthcheck", {
    fetchImpl: async () => {
      calls += 1;
      return fakeResponse(true);
    },
    sleep: async () => {},
  });

  assert.equal(calls, 1);
});

test("polls until the endpoint recovers, within maxAttempts", async () => {
  let calls = 0;
  await waitUntilReady("https://example.test/uk/api/news/items", {
    maxAttempts: 5,
    fetchImpl: async () => {
      calls += 1;
      return fakeResponse(calls >= 3);
    },
    sleep: async () => {},
  });

  assert.equal(calls, 3);
});

test("throws once maxAttempts is exhausted without success", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      waitUntilReady("https://example.test/healthcheck", {
        maxAttempts: 3,
        fetchImpl: async () => {
          calls += 1;
          return fakeResponse(false);
        },
        sleep: async () => {},
      }),
    /not ready after 3 attempts/,
  );

  assert.equal(calls, 3);
});

test("treats a network error as a failed attempt and keeps polling", async () => {
  let calls = 0;
  await waitUntilReady("https://example.test/healthcheck", {
    maxAttempts: 3,
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("ECONNREFUSED");
      }
      return fakeResponse(true);
    },
    sleep: async () => {},
  });

  assert.equal(calls, 2);
});

test("reports each attempt via onAttempt", async () => {
  const events = [];
  let calls = 0;
  await waitUntilReady("https://example.test/healthcheck", {
    maxAttempts: 2,
    fetchImpl: async () => {
      calls += 1;
      return fakeResponse(calls === 2);
    },
    sleep: async () => {},
    onAttempt: (event) => events.push(event),
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].ok, false);
  assert.equal(events[1].ok, true);
});
