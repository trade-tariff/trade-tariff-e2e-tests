import { expect, test as base } from "@playwright/test";

import { createAuthenticatedState } from "./utils/authState.js";
import { createIdentityAuthenticatedState } from "./utils/loggedInDevHubState.js";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

const EMPTY_STORAGE_STATE = { cookies: [], origins: [] };
const isProduction = /www\.trade-tariff\.service\.gov\.uk/.test(
  process.env.BASE_URL ?? "",
);

function createAuthenticatedTest({ enabled, baseURL, url }) {
  const workerStorageState = enabled
    ? [
        async ({ browser }, use) => {
          const state = await createAuthenticatedState(browser, {
            enabled: true,
            baseURL,
            url,
            password: process.env.BASIC_PASSWORD,
            extraHTTPHeaders: wafBypassHeaders(),
          });
          await use(state);
        },
        { scope: "worker" },
      ]
    : [
        async ({ browserName }, use) => {
          void browserName;
          await use(EMPTY_STORAGE_STATE);
        },
        { scope: "worker" },
      ];

  return base.extend({
    storageState: async ({ workerStorageState }, use) => {
      await use(workerStorageState);
    },
    workerStorageState,
  });
}

function createDevHubAuthenticatedTest({ enabled, baseURL }) {
  const workerStorageState = enabled
    ? [
      async ({ browser }, use) => {
        const state = await createIdentityAuthenticatedState(browser, {
          enabled: true,
          baseURL: process.env.URL,
          extraHTTPHeaders: wafBypassHeaders(),
        });
        await use(state);
      },
      { scope: "worker" },
    ]
    : [
        async ({ browserName }, use) => {
          void browserName;
          await use(EMPTY_STORAGE_STATE);
        },
        { scope: "worker" },
      ];

  return base.extend({
    storageState: async ({ workerStorageState }, use) => {
      await use(workerStorageState);
    },
    workerStorageState,
  });
};

export const test = createAuthenticatedTest({
  enabled:
    !isProduction &&
    process.env.SKIP_FRONTEND !== "true" &&
    Boolean(process.env.BASIC_PASSWORD),
  baseURL: process.env.BASE_URL,
  url: "/find_commodity",
});

export const adminTest = createAuthenticatedTest({
  enabled:
    !isProduction &&
    process.env.SKIP_ADMIN !== "true" &&
    Boolean(process.env.ADMIN_URL) &&
    Boolean(process.env.BASIC_PASSWORD),
  baseURL: process.env.ADMIN_URL,
  url: process.env.ADMIN_URL,
});

export const devHubTest = createDevHubAuthenticatedTest({
  enabled:
    !isProduction &&
    process.env.SKIP_DEV_HUB !== "true",
  baseURL: process.env.DEV_HUB_URL,
})

export { expect };
