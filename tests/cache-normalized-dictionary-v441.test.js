import test from "node:test";
import assert from "node:assert/strict";
import { normalizeListCache } from "../src/core/cache-codec.js";

test("M441 normalized cache fallback has no Object prototype values", () => {
  const normalized = normalizeListCache(null);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(normalized.constructor, undefined);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
});

test("M441 actual canonical constructor cache key remains representable", () => {
  const input = Object.create(null);
  input.constructor = {
    block: [{ kind: "domain", value: "example.test" }],
    allow: [],
    nextRefreshAt: 0
  };
  const normalized = normalizeListCache(input);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(typeof normalized.constructor, "object");
});
