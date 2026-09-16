export const NAMESPACE = "TradeTariff/E2E";

// Playwright reports passed, failed, timedOut, interrupted and skipped.
// Only passed is a success; only skipped has no outcome at all. A timeout
// on a monitored journey is a failure and must not be dropped.
function outcomeOf(status) {
  if (status === "passed") {
    return "passed";
  }

  if (status === "skipped") {
    return "skipped";
  }

  return "failed";
}

function dimension(name, value) {
  return { Name: name, Value: value };
}

function datum(name, unit, value, dimensions) {
  return {
    MetricName: name,
    Unit: unit,
    Value: value,
    Dimensions: dimensions,
  };
}

function tally(tests) {
  const counts = { passed: 0, failed: 0, skipped: 0, retries: 0 };

  for (const item of tests) {
    counts[outcomeOf(item.status)] += 1;
    counts.retries += item.retry;
  }

  return counts;
}

export function buildMetricDatums({ environment, tests, run }) {
  const datums = [];

  for (const item of tests) {
    const dimensions = [
      dimension("Environment", environment),
      dimension("Spec", item.spec),
      dimension("Test", item.title),
    ];

    datums.push(datum("TestDuration", "Milliseconds", item.duration, dimensions));

    // A skipped test has no pass/fail outcome. Emitting either 1 or 0 would
    // misreport it, so emit nothing and let TestsSkipped carry the signal.
    if (outcomeOf(item.status) !== "skipped") {
      const passed = outcomeOf(item.status) === "passed";
      datums.push(datum("TestResult", "Count", passed ? 1 : 0, dimensions));
    }
  }

  const runDimensions = [dimension("Environment", environment)];
  const counts = tally(tests);

  datums.push(datum("RunDuration", "Milliseconds", run.duration, runDimensions));
  datums.push(datum("RunResult", "Count", run.status === "passed" ? 1 : 0, runDimensions));
  datums.push(datum("TestsCompleted", "Count", tests.length, runDimensions));
  datums.push(datum("TestsPassed", "Count", counts.passed, runDimensions));
  datums.push(datum("TestsFailed", "Count", counts.failed, runDimensions));
  datums.push(datum("TestsSkipped", "Count", counts.skipped, runDimensions));
  datums.push(datum("TestRetries", "Count", counts.retries, runDimensions));

  return datums;
}
