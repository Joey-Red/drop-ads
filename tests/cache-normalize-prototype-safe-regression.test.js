import test from "node:test";
import assert from "node:assert/strict";
import { encodeCacheEntry, normalizeListCache } from "../src/core/cache-codec.js";

test("normalized cache uses a null-prototype dictionary and preserves own constructor key", () => {
  const entry = encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: []
  }, 0);
  const input = Object.create(null);
  Object.defineProperty(input, "constructor", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: entry
  });

  const normalized = normalizeListCache(input);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.deepEqual(normalized.constructor, entry);
});

test("invalid-root cache fallback is also prototype-safe", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.deepEqual(Object.keys(normalized), []);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
});
