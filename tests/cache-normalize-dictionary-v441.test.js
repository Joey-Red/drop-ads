import test from "node:test";
import assert from "node:assert/strict";
import { normalizeListCache } from "../src/core/cache-codec.js";

test("M441 invalid cache fallback is a null-prototype dictionary", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.deepEqual(Object.keys(normalized), []);
});

test("M441 canonical prototype-like cache ids remain own entries", () => {
  const cache = Object.create(null);
  cache.constructor = {
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };

  const normalized = normalizeListCache(cache);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.notEqual(normalized.constructor, Object.prototype.constructor);
});
