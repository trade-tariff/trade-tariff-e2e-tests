import assert from "node:assert/strict";
import test from "node:test";

import CloudWatchReporter from "./cloudwatchReporter.js";

let nextTestId = 0;

function fakeTest(file, titlePath, id) {
  nextTestId += 1;

  return {
    id: id ?? `test-${nextTestId}`,
    location: { file: `/repo/tests/${file}` },
    titlePath: () => ["", "chromium", file, ...titlePath],
  };
}

function recordingClient() {
  const calls = [];
  return {
    calls,
    createClient: async () => ({
      putMetricData: async (input) => {
        calls.push(input);
      },
    }),
  };
}

function reporterWith(client, overrides = {}) {
  return new CloudWatchReporter({
    enabled: true,
    environment: "production",
    createClient: client.createClient,
    ...overrides,
  });
}

test("publishes datums to the agreed namespace", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client);

  reporter.onTestEnd(
    fakeTest("find-commodity.spec.js", ["Find Commodity", "searches"]),
    {
      status: "passed",
      duration: 1200,
      retry: 0,
    },
  );
  await reporter.onEnd({ status: "passed", duration: 45000 });

  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].Namespace, "TradeTariff/E2E");
});

test("derives spec and test name from the title path", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client);

  reporter.onTestEnd(
    fakeTest("find-commodity.spec.js", ["Find Commodity", "searches"]),
    {
      status: "passed",
      duration: 1200,
      retry: 0,
    },
  );
  await reporter.onEnd({ status: "passed", duration: 45000 });

  const [duration] = client.calls[0].MetricData.filter(
    (datum) => datum.MetricName === "TestDuration",
  );
  assert.deepEqual(duration.Dimensions, [
    { Name: "Environment", Value: "production" },
    { Name: "Spec", Value: "find-commodity.spec.js" },
    { Name: "Test", Value: "Find Commodity > searches" },
  ]);
});

test("publishes run level metrics when no tests ran", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client);

  await reporter.onEnd({ status: "failed", duration: 900 });

  const names = client.calls[0].MetricData.map((datum) => datum.MetricName);
  assert.ok(names.includes("TestsCompleted"));
  assert.ok(names.includes("RunResult"));
});

test("publishes nothing when disabled", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client, { enabled: false });

  reporter.onTestEnd(fakeTest("a.spec.js", ["a"]), {
    status: "passed",
    duration: 1,
    retry: 0,
  });
  await reporter.onEnd({ status: "passed", duration: 2 });

  assert.equal(client.calls.length, 0);
});

test("swallows a publishing failure rather than failing the run", async () => {
  const reporter = reporterWith({
    createClient: async () => ({
      putMetricData: async () => {
        throw new Error("AccessDenied");
      },
    }),
  });

  await assert.doesNotReject(() =>
    reporter.onEnd({ status: "passed", duration: 2 }),
  );
});

test("swallows a client construction failure", async () => {
  const reporter = reporterWith({
    createClient: async () => {
      throw new Error("no credentials");
    },
  });

  await assert.doesNotReject(() =>
    reporter.onEnd({ status: "passed", duration: 2 }),
  );
});

test("chunks datums so a large suite cannot be truncated", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client);

  // 600 tests produce 1200 per-test datums plus 7 run level ones.
  for (let index = 0; index < 600; index += 1) {
    reporter.onTestEnd(fakeTest("big.spec.js", [`test ${index}`]), {
      status: "passed",
      duration: 1,
      retry: 0,
    });
  }
  await reporter.onEnd({ status: "passed", duration: 2 });

  assert.equal(client.calls.length, 2);
  assert.ok(client.calls.every((call) => call.MetricData.length <= 1000));

  const total = client.calls.reduce(
    (sum, call) => sum + call.MetricData.length,
    0,
  );
  assert.equal(total, 1207);
});

test("swallows a failure while building datums", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client);

  // buildMetricDatums iterates this; null makes it throw.
  reporter.tests = null;

  await assert.doesNotReject(() =>
    reporter.onEnd({ status: "passed", duration: 2 }),
  );
  assert.equal(client.calls.length, 0);
});

test("collapses retried attempts of the same test into one datum set", async () => {
  const client = recordingClient();
  const reporter = reporterWith(client);
  const test = fakeTest(
    "flaky.spec.js",
    ["Flaky", "sometimes fails"],
    "flaky-test-id",
  );

  reporter.onTestEnd(test, { status: "failed", duration: 30000, retry: 0 });
  reporter.onTestEnd(test, { status: "failed", duration: 30000, retry: 1 });
  reporter.onTestEnd(test, { status: "passed", duration: 1200, retry: 2 });
  await reporter.onEnd({ status: "passed", duration: 45000 });

  assert.equal(client.calls.length, 1);

  const [duration] = client.calls[0].MetricData.filter(
    (datum) => datum.MetricName === "TestDuration",
  );
  assert.equal(duration.Value, 1200);

  const [result] = client.calls[0].MetricData.filter(
    (datum) => datum.MetricName === "TestResult",
  );
  assert.equal(result.Value, 1);

  const [retries] = client.calls[0].MetricData.filter(
    (datum) => datum.MetricName === "TestRetries",
  );
  assert.equal(retries.Value, 2);

  const [completed] = client.calls[0].MetricData.filter(
    (datum) => datum.MetricName === "TestsCompleted",
  );
  assert.equal(completed.Value, 1);
});

test("does not claim stdio, so the list reporter stays primary", () => {
  const reporter = reporterWith(recordingClient());
  assert.equal(reporter.printsToStdio(), false);
});
