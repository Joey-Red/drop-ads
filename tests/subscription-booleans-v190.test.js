import assert from "node:assert/strict";
import test from "node:test";

import {
  BUILT_IN_SUBSCRIPTIONS,
  normalizeSubscription,
  normalizeSubscriptions
} from "../src/core/subscriptions.js";

function candidate(overrides = {}) {
  return {
    id: "external-test",
    title: "External Test",
    format: "hosts",
    sourceUrl: "https://example.com/hosts",
    ...overrides
  };
}

test("subscription booleans keep omission defaults", () => {
  const normalized = normalizeSubscription(candidate());
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.builtIn, false);
});

test("subscription enabled and builtIn accept only real booleans when present", () => {
  for (const value of ["false", 0, 1, null, {}, []]) {
    assert.throws(() => normalizeSubscription(candidate({ enabled: value })), /enabled must be boolean/);
    assert.throws(() => normalizeSubscription(candidate({ builtIn: value })), /builtIn must be boolean/);
  }
  assert.equal(normalizeSubscription(candidate({ enabled: false, builtIn: true })).enabled, false);
  assert.equal(normalizeSubscription(candidate({ enabled: false, builtIn: true })).builtIn, true);
});

test("malformed persisted boolean entries are discarded while reviewed built-ins remain", () => {
  const normalized = normalizeSubscriptions([
    candidate({ id: "bad-bool", enabled: "false" })
  ]);
  assert.equal(normalized.some((item) => item.id === "bad-bool"), false);
  for (const builtIn of BUILT_IN_SUBSCRIPTIONS) {
    assert.equal(normalized.some((item) => item.id === builtIn.id), true);
  }
});

test("real persisted built-in enabled overrides remain respected", () => {
  const first = BUILT_IN_SUBSCRIPTIONS[0];
  const normalized = normalizeSubscriptions([{ ...first, enabled: false }]);
  assert.equal(normalized.find((item) => item.id === first.id).enabled, false);
});
