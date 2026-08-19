import test from "node:test";
import assert from "node:assert/strict";

import { normalizeListCache } from "../src/core/cache-codec.js";

function legacyEntry() {
  return {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };
}

test("M441 normalized list-cache dictionaries have no inherited constructor value", () => {
  const normalized = normalizeListCache({});
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
  assert.equal(normalized.constructor, undefined);
});

test("M441 an actual canonical constructor cache key remains representable as own data", () => {
  const normalized = normalizeListCache({ constructor: legacyEntry() });
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(typeof normalized.constructor, "object");
});

test("M441 invalid cache roots fall back to an empty null-prototype dictionary", () => {
  const normalized = normalizeListCache(new Date());
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.deepEqual(Object.keys(normalized), []);
});
