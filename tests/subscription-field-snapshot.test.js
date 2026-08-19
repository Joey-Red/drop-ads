import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSubscription } from "../src/core/subscriptions.js";

function candidate() {
  return {
    id: "example-list",
    title: " Example List ",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt#fragment",
    enabled: true,
    builtIn: false
  };
}

test("normalizeSubscription canonicalizes detached fields", () => {
  const normalized = normalizeSubscription(candidate());
  assert.equal(normalized.id, "example-list");
  assert.equal(normalized.title, "Example List");
  assert.equal(normalized.sourceUrl, "https://example.com/list.txt");
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.builtIn, false);
});

test("normalizeSubscription accepts null-prototype records", () => {
  const value = Object.assign(Object.create(null), candidate());
  assert.equal(normalizeSubscription(value).format, "hosts");
});

test("normalizeSubscription never executes required-field getters", () => {
  const value = candidate();
  let reads = 0;
  Object.defineProperty(value, "sourceUrl", { enumerable: true, get() { reads += 1; return "https://example.com/list.txt"; } });
  assert.throws(() => normalizeSubscription(value));
  assert.equal(reads, 0);
});

test("normalizeSubscription never executes optional boolean getters", () => {
  const value = candidate();
  let reads = 0;
  Object.defineProperty(value, "enabled", { enumerable: true, get() { reads += 1; return true; } });
  assert.throws(() => normalizeSubscription(value));
  assert.equal(reads, 0);
});

test("normalizeSubscription avoids normal Proxy get traps", () => {
  const value = new Proxy(candidate(), { get() { throw new Error("normal get trap must not run"); } });
  assert.equal(normalizeSubscription(value).id, "example-list");
});

test("normalizeSubscription preserves optional boolean omission defaults", () => {
  const value = candidate();
  delete value.enabled;
  delete value.builtIn;
  const normalized = normalizeSubscription(value);
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.builtIn, false);
});
