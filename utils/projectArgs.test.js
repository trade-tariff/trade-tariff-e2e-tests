import assert from "node:assert/strict";
import test from "node:test";

import { authedProjectsToRun, runProject } from "./projectArgs.js";

const skipFlags = [
  "SKIP_ADMIN",
  "SKIP_DEV_HUB",
  "SKIP_MYOTT",
  "SKIP_PASSWORDLESS_VERIFICATION",
];

function withEnv(values, assertion) {
  const originals = {};
  const effective = {
    ...Object.fromEntries(skipFlags.map((flag) => [flag, undefined])),
    ...values,
  };

  for (const [key, value] of Object.entries(effective)) {
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

for (const args of [
  ["--project", "admin", "dev-hub", "--grep", "myott"],
  ["--project=admin", "dev-hub", "--grep", "myott"],
  ["--project", "admin", "--project=dev-hub"],
]) {
  test(`selects both projects with ${args.join(" ")}`, () => {
    withEnv({ BASE_URL: staging }, () => {
      process.argv = ["node", "playwright", "test", ...args];
      assert.equal(runProject("admin"), true);
      assert.equal(runProject("dev-hub"), true);
      assert.equal(runProject("myott"), false);
      assert.deepEqual(
        authedProjectsToRun().map(({ name }) => name),
        ["admin", "dev-hub"],
      );
    });
  });
}

test("does not treat arguments after -- as project options", () => {
  withEnv({ BASE_URL: staging }, () => {
    process.argv = [
      "node",
      "playwright",
      "test",
      "--project",
      "admin",
      "--",
      "--project=dev-hub",
    ];
    assert.equal(runProject("admin"), true);
    assert.equal(runProject("dev-hub"), false);
  });
});

test("runs admin on a non production environment with no project filter", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: undefined }, () => {
    assert.equal(
      runProject("admin", {
        skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
      }),
      true,
    );
  });
});

test("skips admin when SKIP_ADMIN is true", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: "true" }, () => {
    assert.equal(
      runProject("admin", {
        skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
      }),
      false,
    );
  });
});

test("skips admin when SKIP_PASSWORDLESS_VERIFICATION is true", () => {
  withEnv({ BASE_URL: staging, SKIP_PASSWORDLESS_VERIFICATION: "true" }, () => {
    assert.equal(
      runProject("admin", {
        skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
      }),
      false,
    );
  });
});

test("skips admin when SKIP_ADMIN is true and the admin project is selected", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: "true" }, () => {
    process.argv = ["node", "playwright", "--project", "admin"];
    assert.equal(
      runProject("admin", {
        skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
      }),
      false,
    );
  });
});

test("runs admin when SKIP_ADMIN is any other value", () => {
  withEnv({ BASE_URL: staging, SKIP_ADMIN: "false" }, () => {
    assert.equal(
      runProject("admin", {
        skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
      }),
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
        runProject("admin", {
          skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
        }),
        false,
      );
    },
  );
});

for (const [name, skipVar] of [
  ["dev-hub", "SKIP_DEV_HUB"],
  ["myott", "SKIP_MYOTT"],
]) {
  test(`runs ${name} only when its project is selected`, () => {
    withEnv({ BASE_URL: staging, [skipVar]: undefined }, () => {
      process.argv = ["node", "playwright", `--project=${name}`];
      assert.equal(
        runProject(name, {
          skipVars: [skipVar, "SKIP_PASSWORDLESS_VERIFICATION"],
        }),
        true,
      );
      assert.equal(
        runProject("admin", {
          skipVars: ["SKIP_ADMIN", "SKIP_PASSWORDLESS_VERIFICATION"],
        }),
        false,
      );
    });
  });

  test(`skips ${name} when ${skipVar} is true`, () => {
    withEnv({ BASE_URL: staging, [skipVar]: "true" }, () => {
      assert.equal(
        runProject(name, {
          skipVars: [skipVar, "SKIP_PASSWORDLESS_VERIFICATION"],
        }),
        false,
      );
    });
  });
}

test("authedProjectsToRun returns each enabled project with its URL", () => {
  withEnv(
    {
      BASE_URL: staging,
      ADMIN_URL: "https://admin.example",
      MYOTT_URL: "https://myott.example",
      SKIP_ADMIN: undefined,
      SKIP_DEV_HUB: "true",
      SKIP_MYOTT: undefined,
      SKIP_PASSWORDLESS_VERIFICATION: undefined,
    },
    () => {
      process.argv = ["node", "playwright"];
      assert.deepEqual(
        authedProjectsToRun().map(({ name, url }) => ({ name, url })),
        [
          { name: "admin", url: "https://admin.example" },
          { name: "myott", url: "https://myott.example" },
        ],
      );
    },
  );
});

test("authedProjectsToRun returns nothing when SKIP_PASSWORDLESS_VERIFICATION is true", () => {
  withEnv({ BASE_URL: staging, SKIP_PASSWORDLESS_VERIFICATION: "true" }, () => {
    process.argv = ["node", "playwright"];
    assert.deepEqual(authedProjectsToRun(), []);
  });
});
