import path from "path";

import { buildMetricDatums, NAMESPACE } from "./metricDatums.js";

const MAX_DATUMS_PER_CALL = 1000;

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

// Imported lazily so that disabled runs — local development and every pull
// request — never load the AWS SDK at all.
async function createCloudWatchClient() {
  const { CloudWatchClient, PutMetricDataCommand } = await import(
    "@aws-sdk/client-cloudwatch"
  );
  const client = new CloudWatchClient({});

  return {
    putMetricData: async (input) => {
      await client.send(new PutMetricDataCommand(input));
    },
  };
}

export default class CloudWatchReporter {
  constructor(options = {}) {
    this.enabled = options.enabled ?? process.env.PUBLISH_METRICS === "true";
    this.environment =
      options.environment ?? process.env.PLAYWRIGHT_ENV ?? "development";
    this.createClient = options.createClient ?? createCloudWatchClient;
    this.tests = [];
  }

  // The list reporter owns stdout. Saying so keeps Playwright's output the
  // same as it is today.
  printsToStdio() {
    return false;
  }

  onTestEnd(test, result) {
    this.tests.push({
      spec: path.basename(test.location.file),
      // titlePath() is ["", project, specFile, ...describes, title], so index
      // 3 onwards is the describe path plus the test title. test.title alone
      // is ambiguous across describe blocks in the same file.
      title: test.titlePath().slice(3).join(" > "),
      status: result.status,
      duration: result.duration,
      retry: result.retry,
    });
  }

  async onEnd(result) {
    if (!this.enabled) {
      return;
    }

    const datums = buildMetricDatums({
      environment: this.environment,
      tests: this.tests,
      run: { status: result.status, duration: result.duration },
    });

    try {
      const client = await this.createClient();

      for (const batch of chunk(datums, MAX_DATUMS_PER_CALL)) {
        await client.putMetricData({
          Namespace: NAMESPACE,
          MetricData: batch,
        });
      }

      console.log(`cloudwatch_metrics published=${datums.length}`);
    } catch (error) {
      // Monitoring must never break the signal it monitors. This is logged
      // and swallowed deliberately; the missing-data alarm in the follow-up
      // work is what catches a persistently broken publisher.
      console.log(
        `cloudwatch_metrics publish_failed ${error.name}: ${error.message}`,
      );
    }
  }
}
