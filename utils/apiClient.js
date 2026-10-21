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
    expect(this.status).not.toBe(200);
  }

  async handleResponse(opts) {
    const startTime = Date.now();
    const timeoutMs = opts.timeoutMs ?? ApiClient.#defaultTimeoutMs;
    const sleepFor = opts.sleepFor ?? ApiClient.#retrySleepMs;

    let res = null;
    let success = false;

    for (let attempt = 0; Date.now() - startTime < timeoutMs; attempt++) {
      if (attempt !== 0) {
        console.log(`Retrying, attempt ${attempt}...`);
      }

      try {
        res = await fetch(this.#url, {
          ...opts.requestOptions,
          signal: AbortSignal.timeout(ApiClient.#requestTimeoutMs),
        });

        // if we expect failure, success is a non-200 status
        const ok = res.status === 200;
        if (opts.expectFailure ? !ok : ok) {
          success = true;
          break;
        }
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
