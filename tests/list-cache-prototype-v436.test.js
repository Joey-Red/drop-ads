import test from "node:test";
import assert from "node:assert/strict";

import { normalizeListCache } from "../src/core/cache-codec.js";

test("M436 normalized list-cache fallback has no Object prototype values", () => {
  const cache = normalizeListCache(null);
  assert.equal(Object.getPrototypeOf(cache), null);
  assert.equal(cache.constructor, undefined);
  assert.equal(Object.hasOwn(cache, "constructor"), false);
});

test("M436 normalized list-cache output is a null-prototype dictionary", () => {
  const cache = normalizeListCache({});
  assert.equal(Object.getPrototypeOf(cache), null);
  assert.deepEqual(Object.keys(cache), []);
});
