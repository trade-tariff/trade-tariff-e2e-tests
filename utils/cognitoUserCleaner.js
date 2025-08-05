import { CognitoIdentityProviderClient, ListUserPoolsCommand, ListUsersCommand, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export default class CognitoUserCleaner {
  constructor(userPoolName, region = 'eu-west-2') {
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
      Limit: 1
    });

    try {
      const { Users } = await this.client.send(listCommand);
      if (!Users || Users.length === 0) {
        return false;
      }

      const username = Users[0].Username;

      const deleteCommand = new AdminDeleteUserCommand({
        UserPoolId: poolId,
        Username: username
      });

      await this.client.send(deleteCommand);
      return true;
    } catch (error) {
      console.error(`Error deleting user`, error);
    }
  }

  async getUserPoolIdByName(name) {
    const listPoolsCommand = new ListUserPoolsCommand({ MaxResults: 60 });
    const { UserPools } = await this.client.send(listPoolsCommand);
    const pool = UserPools?.find(p => p.Name === name);
    return pool ? pool.Id : null;
  }
}
