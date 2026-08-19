import test from "node:test";
import assert from "node:assert/strict";

import { normalizeListCache } from "../src/core/cache-codec.js";

test("M436 normalized cache has no inherited constructor value", () => {
  const normalized = normalizeListCache({});
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
  assert.equal(normalized.constructor, undefined);
});

test("M436 a real constructor subscription cache key remains representable", () => {
  const raw = Object.create(null);
  raw.constructor = {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    nextRefreshAt: 0
  };
  const normalized = normalizeListCache(raw);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(typeof normalized.constructor, "object");
});

test("M436 invalid root fallback is also prototype-safe", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(normalized.constructor, undefined);
});
