import assert from "node:assert/strict";
import test from "node:test";

import { retryOnTransientStatus } from "./retryOnTransientStatus.js";

function transientError(status) {
  const error = new Error(`returned ${status}`);
  error.status = status;
  return error;
}

test("returns the result on the first successful attempt", async () => {
  let calls = 0;
  const result = await retryOnTransientStatus(async () => {
    calls += 1;
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("retries a transient status and succeeds once it recovers", async () => {
  let calls = 0;
  const result = await retryOnTransientStatus(
    async () => {
      calls += 1;
      if (calls < 3) {
        throw transientError(503);
      }
      return "ok";
    },
    { delayMs: 0 },
  );

  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("gives up and throws the last error after exhausting retries", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      retryOnTransientStatus(
        async () => {
          calls += 1;
          throw transientError(503);
        },
        { delayMs: 0, maxAttempts: 4 },
      ),
    /returned 503/,
  );

  assert.equal(calls, 4);
});

test("does not retry a non-transient error", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      retryOnTransientStatus(
        async () => {
          calls += 1;
          throw transientError(404);
        },
        { delayMs: 0 },
      ),
    /returned 404/,
  );

  assert.equal(calls, 1);
});
