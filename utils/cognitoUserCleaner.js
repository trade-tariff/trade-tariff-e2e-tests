import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  ListUsersCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { setTimeout as sleep } from "node:timers/promises";

export default class CognitoUserCleaner {
  constructor(userPoolName, region = "eu-west-2") {
    this.userPoolName = userPoolName;
    this.client = new CognitoIdentityProviderClient({ region });
  }

  async deleteUserByEmail(email) {
    const poolId = await this.getUserPoolIdByName(this.userPoolName);
    if (!poolId) {
      throw new Error(`User pool '${this.userPoolName}' not found`);
    }

    const listCommand = new ListUsersCommand({
      UserPoolId: poolId,
      Filter: `email = "${email}"`,
      Limit: 1,
    });

    try {
      const { Users } = await this.client.send(listCommand);
      if (!Users || Users.length === 0) {
        return false;
      }

      const username = Users[0].Username;

      const deleteCommand = new AdminDeleteUserCommand({
        UserPoolId: poolId,
        Username: username,
      });

      await this.client.send(deleteCommand);
      await this.waitUntilUserDeleted(poolId, email);
      return true;
    } catch (error) {
      console.error("Error deleting user from Cognito", {
        name: error?.name,
      });
      throw error;
    }
  }

  async waitUntilUserDeleted(poolId, email, options = {}) {
    const maxWaitMs = options.maxWaitMs ?? 5_000;
    const pollIntervalMs = options.pollIntervalMs ?? 250;
    const wait = options.sleep ?? sleep;
    const maxPolls = Math.ceil(maxWaitMs / pollIntervalMs);

    for (let poll = 0; poll <= maxPolls; poll++) {
      const command = new ListUsersCommand({
        UserPoolId: poolId,
        Filter: `email = "${email}"`,
        Limit: 1,
      });
      const { Users } = await this.client.send(command);

      if (!Users || Users.length === 0) {
        return;
      }

      if (poll < maxPolls) {
        await wait(pollIntervalMs);
      }
    }

    throw new Error(`Cognito user still exists after ${maxWaitMs}ms`);
  }

  async getUserPoolIdByName(name) {
    const listPoolsCommand = new ListUserPoolsCommand({ MaxResults: 60 });
    const { UserPools } = await this.client.send(listPoolsCommand);
    const pool = UserPools?.find((p) => p.Name === name);
    return pool ? pool.Id : null;
  }
}
