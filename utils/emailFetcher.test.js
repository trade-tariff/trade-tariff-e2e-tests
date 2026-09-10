import assert from "node:assert/strict";
import test from "node:test";

import EmailFetcher from "./emailFetcher.js";

function fetcherWithEmails(emails) {
  const fetcher = Object.create(EmailFetcher.prototype);
  fetcher.bucket = "bucket";
  fetcher.prefix = "inbound/";
  fetcher.targetRecipient = "otp@example.test";
  fetcher.s3Client = {
    async send() {
      return {
        Contents: emails.map((email, index) => ({
          Key: email.key,
          LastModified: new Date(emails.length - index),
        })),
      };
    },
  };
  fetcher._fetchAndParseEmail = async (key) => {
    const email = emails.find((candidate) => candidate.key === key);
    return {
      to: email.to ?? "otp@example.test",
      body: email.body,
      s3_key: key,
    };
  };
  return fetcher;
}

test("extracts the six digit code from an email body", () => {
  const fetcher = Object.create(EmailFetcher.prototype);

  const code = fetcher.extractCode({ body: "Your code is 123456, use it now" });

  assert.equal(code, "123456");
});

test("returns null when the body holds no six digit code", () => {
  const fetcher = Object.create(EmailFetcher.prototype);

  const code = fetcher.extractCode({ body: "Nothing useful in here" });

  assert.equal(code, null);
});

test("returns null when the email has no body", () => {
  const fetcher = Object.create(EmailFetcher.prototype);

  assert.equal(fetcher.extractCode({ body: "" }), null);
  assert.equal(fetcher.extractCode(undefined), null);
});

test("skips emails to the target recipient that carry no code", async () => {
  const fetcher = fetcherWithEmails([
    { key: "newest", body: "Welcome, no code in this one" },
    { key: "older", body: "Your code is 987654" },
  ]);

  const email = await fetcher.getLatestEmail();

  assert.equal(email.s3_key, "older");
  assert.equal(email.code, "987654");
});
