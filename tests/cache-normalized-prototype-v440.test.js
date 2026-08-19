import test from "node:test";
import assert from "node:assert/strict";
import { encodeCacheEntry, normalizeListCache } from "../src/core/cache-codec.js";

test("M440 invalid cache fallback has no Object prototype", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
  assert.equal(normalized.constructor, undefined);
});

test("M440 an actual constructor cache id remains an own entry", () => {
  const cache = Object.create(null);
  cache.constructor = encodeCacheEntry({
    block: [{ kind: "domain", value: "example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: []
  }, 0);

  const normalized = normalizeListCache(cache);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(typeof normalized.constructor, "object");
  assert.equal(normalized.constructor.v, 5);
});
