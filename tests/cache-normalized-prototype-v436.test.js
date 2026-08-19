import test from "node:test";
import assert from "node:assert/strict";
import { normalizeListCache } from "../src/core/cache-codec.js";

function compactEntry() {
  return {
    v: 5,
    b: { d: ["ads.example"] },
    a: {},
    c: [1, 0, 0, 0],
    n: 0
  };
}

test("M436 normalized cache has no inherited prototype keys", () => {
  const normalized = normalizeListCache({});
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), false);
  assert.equal(normalized.constructor, undefined);
});

test("M436 a real canonical constructor cache key remains representable", () => {
  const input = Object.create(null);
  input.constructor = compactEntry();
  const normalized = normalizeListCache(input);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.equal(Object.hasOwn(normalized, "constructor"), true);
  assert.equal(normalized.constructor.v, 5);
});

test("M436 invalid roots still return prototype-safe empty dictionaries", () => {
  const normalized = normalizeListCache([]);
  assert.equal(Object.getPrototypeOf(normalized), null);
  assert.deepEqual(Object.keys(normalized), []);
});
