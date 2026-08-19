import test from "node:test";
import assert from "node:assert/strict";
import { encodeCacheEntry, normalizeListCache } from "../src/core/cache-codec.js";

test("M439 invalid cache fallback has no Object prototype entries", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(normalized.constructor, undefined);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
});

test("M439 an actual canonical constructor cache id remains representable", () => {
  const entry = encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: []
  }, 0);
  const source = Object.create(null);
  source.constructor = entry;
  const normalized = normalizeListCache(source);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(normalized.constructor.v, entry.v);
});
