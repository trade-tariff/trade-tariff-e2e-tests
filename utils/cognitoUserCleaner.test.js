import assert from "node:assert/strict";
import test from "node:test";

import CognitoUserCleaner from "./cognitoUserCleaner.js";

test("waits until Cognito no longer returns the deleted user", async () => {
  const responses = [{ Users: [{ Username: "existing-user" }] }, { Users: [] }];
  const sleeps = [];
  const cleaner = new CognitoUserCleaner("subscriptions");
  cleaner.client = {
    async send() {
      return responses.shift();
    },
  };

  await cleaner.waitUntilUserDeleted("pool-id", "test@example.com", {
    maxWaitMs: 1_000,
    pollIntervalMs: 250,
    sleep: async (duration) => sleeps.push(duration),
  });

  assert.deepEqual(sleeps, [250]);
  assert.equal(responses.length, 0);
});

test("confirms the user is absent after deleting it", async () => {
  const commands = [];
  const waits = [];
  const cleaner = new CognitoUserCleaner("subscriptions");
  cleaner.getUserPoolIdByName = async () => "pool-id";
  cleaner.client = {
    async send(command) {
      commands.push(command.constructor.name);
      if (command.constructor.name === "ListUsersCommand") {
        return { Users: [{ Username: "existing-user" }] };
      }
      return {};
    },
  };
  cleaner.waitUntilUserDeleted = async (poolId, email) => {
    waits.push([poolId, email]);
  };

  const deleted = await cleaner.deleteUserByEmail("test@example.com");

  assert.equal(deleted, true);
  assert.deepEqual(commands, ["ListUsersCommand", "AdminDeleteUserCommand"]);
  assert.deepEqual(waits, [["pool-id", "test@example.com"]]);
});

test("fails when deletion cannot be confirmed", async (context) => {
  context.mock.method(console, "error", () => {});
  const cleaner = new CognitoUserCleaner("subscriptions");
  cleaner.getUserPoolIdByName = async () => "pool-id";
  cleaner.client = {
    async send(command) {
      if (command.constructor.name === "ListUsersCommand") {
        return { Users: [{ Username: "existing-user" }] };
      }
      return {};
    },
  };
  cleaner.waitUntilUserDeleted = async () => {
    throw new Error("user still exists");
  };

  await assert.rejects(
    cleaner.deleteUserByEmail("test@example.com"),
    /user still exists/,
  );
});
