import { expect } from "@playwright/test";
import { wafBypassHeaders } from "./wafBypassHeaders.js";

export default class ApiClient {
  static #defaultTimeoutMs = 45_000;
  static #requestTimeoutMs = 5_000;
  static #retrySleepMs = 1000;
  #apiKey;
  #url;

  constructor(apiKey) {
    this.#url = process.env.FPO_SEARCH_URL;
    if (!this.#url) throw new Error("FPO_SEARCH_URL is not set.");
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

    this.status = res?.status ?? null;
    this.json = res ? await res.json().catch(() => null) : null;
  }

  assertSuccessful() {
    expect(this.status).toBe(200);
  }

  assertUnsuccessful() {
    expect([401, 403]).toContain(this.status);
  }

  async handleResponse(opts) {
    const startTime = Date.now();
    const timeoutMs = opts.timeoutMs ?? ApiClient.#defaultTimeoutMs;
    const sleepFor = opts.sleepFor ?? ApiClient.#retrySleepMs;

    let res = null;
    let success = false;
    // API Gateway will respond 401 or 403 if we don't supply a valid API key,
    // any other error is a different failure to what we are testing
    let expectedStatus = opts.expectFailure ? [401, 403] : [200];

    for (let attempt = 0; Date.now() - startTime < timeoutMs; attempt++) {
      if (attempt !== 0) {
        console.log(`Retrying, attempt ${attempt}...`);
      }

      res = null;

      try {
        res = await fetch(this.#url, {
          ...opts.requestOptions,
          signal: AbortSignal.timeout(ApiClient.#requestTimeoutMs),
        });

        if (expectedStatus.includes(res.status)) {
          success = true;
          break;
        }

        await res.body?.cancel();
      } catch (error) {
        console.warn(`Request failed: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, sleepFor));
    }

    const endTime = Date.now();
    const deltaSeconds = (endTime - startTime) / 1000;
    const state = opts.expectFailure ? "inactive" : "active";

    console.log(
      success
        ? `Key ${state} in ${deltaSeconds}s.`
        : `Key failed to be ${state} after ${deltaSeconds}s.`,
    );

    if (!success) {
      throw new Error(
        `Expected status ${expectedStatus.join(" or ")}, received ${res?.status ?? "no response"} after ${deltaSeconds}s.`,
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
