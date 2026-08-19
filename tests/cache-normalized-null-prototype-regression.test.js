import test from "node:test";
import assert from "node:assert/strict";
import { encodeCacheEntry, normalizeListCache } from "../src/core/cache-codec.js";

test("normalized list-cache dictionaries have no Object prototype", () => {
  const normalized = normalizeListCache({});
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(normalized.constructor, undefined);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
});

test("an actual canonical constructor cache key remains representable", () => {
  const entry = encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: []
  }, 0);
  const normalized = normalizeListCache({ constructor: entry });
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(normalized.constructor.v, 5);
});

test("invalid cache roots fail closed to a null-prototype dictionary", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.deepEqual(Object.keys(normalized), []);
});
