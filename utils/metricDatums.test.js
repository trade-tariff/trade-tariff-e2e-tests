import assert from "node:assert/strict";
import test from "node:test";

import { buildMetricDatums, NAMESPACE } from "./metricDatums.js";

function datumNamed(datums, name) {
  return datums.filter((datum) => datum.MetricName === name);
}

function valueOf(datums, name) {
  const [datum] = datumNamed(datums, name);
  return datum?.Value;
}

function aTest(overrides = {}) {
  return {
    spec: "find-commodity.spec.js",
    title: "Find Commodity > searches by code",
    status: "passed",
    duration: 1200,
    retry: 0,
    ...overrides,
  };
}

const aRun = { status: "passed", duration: 45000 };

test("namespace is the agreed value", () => {
  assert.equal(NAMESPACE, "TradeTariff/E2E");
});

test("emits duration and result for a passing test", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [aTest()],
    run: aRun,
  });

  const [duration] = datumNamed(datums, "TestDuration");
  assert.equal(duration.Value, 1200);
  assert.equal(duration.Unit, "Milliseconds");
  assert.deepEqual(duration.Dimensions, [
    { Name: "Environment", Value: "production" },
    { Name: "Spec", Value: "find-commodity.spec.js" },
    { Name: "Test", Value: "Find Commodity > searches by code" },
  ]);

  const [result] = datumNamed(datums, "TestResult");
  assert.equal(result.Value, 1);
  assert.equal(result.Unit, "Count");
});

test("records a failing test as zero", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [aTest({ status: "failed" })],
    run: aRun,
  });

  const [result] = datumNamed(datums, "TestResult");
  assert.equal(result.Value, 0);
});

test("treats timedOut and interrupted as failures", () => {
  for (const status of ["timedOut", "interrupted"]) {
    const datums = buildMetricDatums({
      environment: "production",
      tests: [aTest({ status })],
      run: aRun,
    });

    const [result] = datumNamed(datums, "TestResult");
    assert.equal(result.Value, 0, `${status} should count as a failure`);
    assert.equal(valueOf(datums, "TestsFailed"), 1);
  }
});

test("a skipped test gets a duration but no result", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [aTest({ status: "skipped" })],
    run: aRun,
  });

  assert.equal(datumNamed(datums, "TestDuration").length, 1);
  assert.equal(datumNamed(datums, "TestResult").length, 0);
  assert.equal(valueOf(datums, "TestsSkipped"), 1);
  assert.equal(valueOf(datums, "TestsPassed"), 0);
  assert.equal(valueOf(datums, "TestsFailed"), 0);
});

test("counts outcomes across a mixed run", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [
      aTest({ title: "a", status: "passed" }),
      aTest({ title: "b", status: "failed" }),
      aTest({ title: "c", status: "skipped" }),
      aTest({ title: "d", status: "passed" }),
    ],
    run: aRun,
  });

  assert.equal(valueOf(datums, "TestsCompleted"), 4);
  assert.equal(valueOf(datums, "TestsPassed"), 2);
  assert.equal(valueOf(datums, "TestsFailed"), 1);
  assert.equal(valueOf(datums, "TestsSkipped"), 1);
});

test("sums retries across tests", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [
      aTest({ title: "a", retry: 2 }),
      aTest({ title: "b", retry: 1 }),
      aTest({ title: "c", retry: 0 }),
    ],
    run: aRun,
  });

  assert.equal(valueOf(datums, "TestRetries"), 3);
});

test("emits run level metrics even when no tests ran", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [],
    run: { status: "failed", duration: 900 },
  });

  assert.equal(valueOf(datums, "TestsCompleted"), 0);
  assert.equal(valueOf(datums, "RunResult"), 0);
  assert.equal(valueOf(datums, "RunDuration"), 900);
  assert.equal(datumNamed(datums, "TestDuration").length, 0);
});

test("run level metrics carry only the environment dimension", () => {
  const datums = buildMetricDatums({
    environment: "production",
    tests: [aTest()],
    run: aRun,
  });

  const [runResult] = datumNamed(datums, "RunResult");
  assert.deepEqual(runResult.Dimensions, [
    { Name: "Environment", Value: "production" },
  ]);
});
