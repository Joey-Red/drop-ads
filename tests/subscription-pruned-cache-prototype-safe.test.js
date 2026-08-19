import test from "node:test";
import assert from "node:assert/strict";
import { makeCacheEntry } from "../src/core/list-updates.js";
import { pruneListCache, subscriptionSourceKey } from "../src/core/subscriptions.js";

const subscription = {
  id: "constructor",
  title: "Constructor source",
  format: "hosts",
  sourceUrl: "https://example.com/hosts.txt",
  enabled: true,
  builtIn: false
};

function entryFor(candidate = subscription) {
  return makeCacheEntry({
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    sourceKey: subscriptionSourceKey(candidate)
  }, 0, 0);
}

test("pruned cache is a null-prototype dictionary with a real constructor key", () => {
  const sourceCache = Object.create(null);
  sourceCache.constructor = entryFor();
  const pruned = pruneListCache([subscription], sourceCache);

  assert.equal(Object.getPrototypeOf(pruned), null);
  assert.equal(Object.hasOwn(pruned, "constructor"), true);
  assert.equal(pruned.constructor, sourceCache.constructor);
  assert.deepEqual(Object.keys(pruned), ["constructor"]);
});

test("ordinary Object prototype constructor is not treated as a cache entry", () => {
  const pruned = pruneListCache([subscription], {});
  assert.equal(Object.getPrototypeOf(pruned), null);
  assert.equal(Object.hasOwn(pruned, "constructor"), false);
});

test("source-mismatched constructor entry is not retained", () => {
  const other = { ...subscription, sourceUrl: "https://example.com/other.txt" };
  const sourceCache = Object.create(null);
  sourceCache.constructor = entryFor(other);
  const pruned = pruneListCache([subscription], sourceCache);
  assert.equal(Object.hasOwn(pruned, "constructor"), false);
});
