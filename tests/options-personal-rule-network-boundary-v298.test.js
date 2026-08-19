import test from "node:test";
import assert from "node:assert/strict";
import { MAX_NETWORK_RULE_RESOURCE_TYPES } from "../src/core/rules.js";
import { unwrapOptionsRuntimeResponse } from "../src/core/options-boundary.js";

function response(rule, overrides = {}) {
  return {
    ok: true,
    result: {
      field: "personalBlock",
      changed: true,
      rule,
      communitySubmission: "not-requested",
      ...overrides
    }
  };
}

test("changed personal-rule results accept reviewed network rule kinds", () => {
  for (const rule of [
    { kind: "domain", value: "example.com" },
    { kind: "url", value: "https://example.com/path?q=1" },
    { kind: "pattern", value: "||ads.example.com^" },
    { kind: "domain", value: "example.com", resourceTypes: ["image", "script"] }
  ]) {
    assert.deepEqual(
      unwrapOptionsRuntimeResponse(response(rule), "fallback"),
      { communitySubmission: "not-requested" }
    );
  }
});

test("changed personal-rule results reject unsupported and malformed network rules", () => {
  for (const rule of [
    { kind: "unknown", value: "example.com" },
    { kind: "domain", value: "example.com", extra: true },
    { kind: "url", value: "javascript:alert(1)" },
    { kind: "domain", value: "not a domain" },
    { kind: "domain", value: "example.com", resourceTypes: ["unsupported"] },
    "example.com",
    7
  ]) {
    assert.throws(
      () => unwrapOptionsRuntimeResponse(response(rule), "fallback"),
      /valid network rule|JSON-like data/
    );
  }
});

test("changed personal-rule result keeps the raw resource-type work ceiling", () => {
  const exact = Array.from({ length: MAX_NETWORK_RULE_RESOURCE_TYPES }, () => "image");
  assert.deepEqual(
    unwrapOptionsRuntimeResponse(response({ kind: "domain", value: "example.com", resourceTypes: exact }), "fallback"),
    { communitySubmission: "not-requested" }
  );

  const oneOver = Array.from({ length: MAX_NETWORK_RULE_RESOURCE_TYPES + 1 }, () => "image");
  assert.throws(
    () => unwrapOptionsRuntimeResponse(response({ kind: "domain", value: "example.com", resourceTypes: oneOver }), "fallback"),
    /valid network rule/
  );
});

test("changed personal-rule result rejects nested rule accessors without getter execution", () => {
  let calls = 0;
  const rule = { kind: "domain" };
  Object.defineProperty(rule, "value", {
    enumerable: true,
    get() { calls += 1; return "example.com"; }
  });
  assert.throws(() => unwrapOptionsRuntimeResponse(response(rule), "fallback"));
  assert.equal(calls, 0);
});

test("personalAllow still validates its changed rule while suppressing community outcomes", () => {
  assert.deepEqual(
    unwrapOptionsRuntimeResponse(response(
      { kind: "domain", value: "example.com" },
      { field: "personalAllow", communitySubmission: "not-requested" }
    ), "fallback"),
    { communitySubmission: "not-requested" }
  );
  assert.throws(() => unwrapOptionsRuntimeResponse(response(
    { kind: "domain", value: "example.com", extra: true },
    { field: "personalAllow", communitySubmission: "not-requested" }
  ), "fallback"), /valid network rule/);
});
