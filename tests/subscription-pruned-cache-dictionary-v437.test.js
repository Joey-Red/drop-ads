import test from "node:test";
import assert from "node:assert/strict";

import { encodeCacheEntry } from "../src/core/cache-codec.js";
import { pruneListCache } from "../src/core/subscriptions.js";

const constructorSubscription = {
  id: "constructor",
  title: "Constructor feed",
  format: "third-party",
  sourceUrl: "https://example.com/ads.txt",
  enabled: true,
  builtIn: false
};

test("M437 pruned cache never inherits constructor", () => {
  const pruned = pruneListCache([constructorSubscription], Object.create(null));
  assert.equal(Object.getPrototypeOf(pruned), null);
  assert.equal(Object.hasOwn(pruned, "constructor"), false);
  assert.equal(pruned.constructor, undefined);
});

test("M437 a real own constructor cache entry survives pruning", () => {
  const cache = Object.create(null);
  cache.constructor = encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: []
  }, 0);
  const pruned = pruneListCache([constructorSubscription], cache);
  assert.equal(Object.getPrototypeOf(pruned), null);
  assert.equal(Object.hasOwn(pruned, "constructor"), true);
  assert.equal(typeof pruned.constructor, "object");
});
