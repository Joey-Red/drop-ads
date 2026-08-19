import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_SUBSCRIPTIONS,
  MAX_NORMALIZED_SUBSCRIPTIONS,
  normalizeSubscriptions
} from "../src/core/subscriptions.js";

function external(index) {
  return {
    id: `external-${index}`,
    title: `External ${index}`,
    format: "hosts",
    sourceUrl: `https://example${index}.com/hosts`,
    enabled: true,
    builtIn: false
  };
}

test("non-array legacy subscription input yields canonical built-ins", () => {
  assert.deepEqual(normalizeSubscriptions(null), BUILT_IN_SUBSCRIPTIONS.map((item) => ({ ...item })));
});

test("subscription arrays reject holes and extra properties", () => {
  const holey = new Array(1);
  assert.throws(() => normalizeSubscriptions(holey), /enumerable data entries|dense array/);

  const extra = [];
  Object.defineProperty(extra, "extra", { value: true, enumerable: true });
  assert.throws(() => normalizeSubscriptions(extra), /dense array indices/);
});

test("subscription arrays reject accessor entries without executing getters", () => {
  let getterCalls = 0;
  const input = [];
  Object.defineProperty(input, "0", {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls += 1;
      return external(0);
    }
  });
  input.length = 1;

  assert.throws(() => normalizeSubscriptions(input), /enumerable data entries/);
  assert.equal(getterCalls, 0);
});

test("subscription arrays enforce the raw 128-entry ceiling", () => {
  const exact = Array.from({ length: MAX_NORMALIZED_SUBSCRIPTIONS }, (_, index) => external(index));
  const normalized = normalizeSubscriptions(exact);
  assert.equal(normalized.length, BUILT_IN_SUBSCRIPTIONS.length + MAX_NORMALIZED_SUBSCRIPTIONS);

  const oneOver = [...exact, external(MAX_NORMALIZED_SUBSCRIPTIONS)];
  assert.throws(() => normalizeSubscriptions(oneOver), /at most 128/);
});

test("subscription normalization snapshots array entries before candidate work", () => {
  const first = external(1);
  const second = external(2);
  const input = [first, second];
  const originalUrl = first.sourceUrl;

  Object.defineProperty(first, "title", {
    enumerable: true,
    configurable: true,
    get() {
      input[1] = external(99);
      return "Mutating";
    }
  });

  const normalized = normalizeSubscriptions(input);
  // The malformed accessor-bearing first candidate is discarded. Snapshotting the
  // outer array prevents that candidate from replacing the second entry mid-pass.
  assert.ok(normalized.some((item) => item.id === second.id));
  assert.ok(!normalized.some((item) => item.id === "external-99"));
  assert.equal(originalUrl, "https://example1.com/hosts");
});
