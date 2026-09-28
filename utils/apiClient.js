import { expect } from "@playwright/test";
import { wafBypassHeaders } from "./wafBypassHeaders.js";

export default class ApiClient {
  static #url = process.env.FPO_SEARCH_URL;
  static #defaultRetries = 120;
  static #retrySleepMs = 1000;
  #apiKey;

  constructor(apiKey) {
    this.#apiKey = apiKey;
    this.status = null;
    this.json = null;
  }

  async doClassification(opts) {
    const handleOpts = {
      requestOptions: this.#createPostRequestOptions(opts.description),
      expectFailure: opts.expectFailure ?? false,
    };

    const res = await this.handleResponse(handleOpts);

    this.status = res.status ?? null;
    this.json = await res.json().catch(() => null); // guard against throwing
  }

  assertSuccessful() {
    expect(this.status).toBe(200);
  }

  assertUnsuccessful() {
    expect(this.status).not.toBe(200);
  }

  async handleResponse(opts) {
    const startTime = Date.now();
    const retries = opts.retries ?? ApiClient.#defaultRetries;
    const sleepFor = opts.sleepFor ?? ApiClient.#retrySleepMs;

    let res = null;
    let success = false;

    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt !== 0) {
        console.log(`Retrying, attempt ${attempt} of ${retries}...`);
      }

      res = await fetch(ApiClient.#url, opts.requestOptions);

      // if we expect failure, success is a non-200 status
      if (opts.expectFailure) {
        if (res.status !== 200) {
          success = true;
          break;
        }
      } else {
        if (res.status === 200) {
          success = true;
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, sleepFor));
    }

    const endTime = Date.now();
    const deltaSeconds = (endTime - startTime) / 1000;

    if (success) {
      console.log(
        `Key ${opts.expectFailure ? "inactive" : "active"} in ${deltaSeconds} seconds`,
      );
    } else {
      console.log(
        `Key failed to be ${opts.expectFailure ? "inactive" : "active"} in ${deltaSeconds} seconds`,
      );
    }

    return res;
  }

  assertClassification(expectedClassification) {
    const data = this.json ?? {};
    const results = data.results ?? [];
    const matchedResult = results.find(
      (result) => result.code === expectedClassification,
    );

    expect(matchedResult).toBeDefined();
  }

  #createPostRequestOptions(description) {
    const body = JSON.stringify({ description });
    return {
      method: "POST",
      headers: {
        ...wafBypassHeaders(),
        "X-Api-Key": this.#apiKey ?? "",
        "Content-Type": "application/json",
      },
      body,
    };
  }
}
