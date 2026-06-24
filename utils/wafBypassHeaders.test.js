import assert from "node:assert/strict";
import test from "node:test";

import { wafBypassHeaders } from "./wafBypassHeaders.js";

test("returns an empty header set when no WAF bypass token is configured", () => {
  assert.deepEqual(wafBypassHeaders(), {});
});

test("returns the WAF bypass header when a token is configured", () => {
  assert.deepEqual(wafBypassHeaders("secret-token"), {
    "x-waf-bypass": "secret-token",
  });
});
