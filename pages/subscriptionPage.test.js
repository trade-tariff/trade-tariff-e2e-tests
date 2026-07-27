import assert from "node:assert/strict";
import test from "node:test";

import SubscriptionPage from "./subscriptionPage.js";

test("polls quickly for the first incoming email retry", async () => {
  const delays = [];
  const email = {
    code: ["123456"],
    send_date: new Date(Date.now() + 1_000),
  };
  const responses = [undefined, email];
  const subscriptionPage = Object.create(SubscriptionPage.prototype);
  subscriptionPage.fetcher = {
    async getLatestEmail() {
      return responses.shift();
    },
  };
  subscriptionPage.sleep = async (duration) => delays.push(duration);

  const result = await subscriptionPage.waitForEmail();

  assert.equal(result, email);
  assert.deepEqual(delays, [250]);
});
