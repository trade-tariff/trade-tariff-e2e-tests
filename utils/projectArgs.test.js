import assert from "node:assert/strict";
import test from "node:test";

import { runProject } from "./projectArgs.js";

function withEnv(values, assertion) {
  const originals = {};

  for (const [key, value] of Object.entries(values)) {
    originals[key] = process.env[key];

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const originalArgv = process.argv;

  try {
    assertion();
  } finally {
    process.argv = originalArgv;

    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

const staging = "https://staging.trade-tariff.service.gov.uk";

test("runs admin on a non production environment with no project filter", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: undefined }, () => {
    assert.equal(
      runProject("admin", { skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS"] }),
      true,
    );
  });
});

test("skips admin when SKIP_ADMIN is true", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: "true" }, () => {
    assert.equal(
      runProject("admin", { skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS"] }),
      false,
    );
  });
});

test("skips admin when SKIP_PASSWORDLESS is true", () => {
  withEnv({ BASE_URL: staging, SKIP_PASSWORDLESS: "true" }, () => {
    assert.equal(
      runProject("admin", { skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS"] }),
      false,
    );
  });
});

test("skips admin when SKIP_ADMIN is true and the admin project is selected", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: "true" }, () => {
    process.argv = ["node", "playwright", "--project", "admin"];
    assert.equal(
      runProject("admin", { skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS"] }),
      false,
    );
  });
});

test("runs admin when SKIP_ADMIN is any other value", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: "false" }, () => {
    assert.equal(
      runProject("admin", { skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS"] }),
      true,
    );
  });
});

test("skips admin on production", () => {
  withEnv(
    {
      BASE_URL: "https://www.trade-tariff.service.gov.uk",
      SKIP_ADMIN: undefined,
    },
    () => {
      assert.equal(
        runProject("admin", { skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS"] }),
        false,
      );
    },
  );
});
