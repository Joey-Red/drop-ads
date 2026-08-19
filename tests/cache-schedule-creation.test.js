import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_REFRESH_MS, makeCacheEntry } from "../src/core/list-updates.js";

const parsed = { block: [{ kind: "domain", value: "ads.example.com" }], allow: [] };

test("cache schedule preserves immediate-due and normal refresh timing", () => {
  assert.equal(makeCacheEntry(parsed, 0, 0).n, 0);
  assert.equal(makeCacheEntry(parsed, 1_000).n, 1_000 + DEFAULT_REFRESH_MS);
});

test("cache schedule rejects type-confused values without coercion", () => {
  assert.throws(() => makeCacheEntry(parsed, "1000", 1), /current time/i);
  assert.throws(() => makeCacheEntry(parsed, 1000, "1"), /refresh delay/i);

  let coercions = 0;
  const coercive = {
    valueOf() { coercions += 1; return 1; },
    toString() { coercions += 1; return "1"; }
  };
  assert.throws(() => makeCacheEntry(parsed, coercive, 1), /current time/i);
  assert.throws(() => makeCacheEntry(parsed, 1, coercive), /refresh delay/i);
  assert.equal(coercions, 0);
});

test("cache schedule rejects negative, non-finite, and overflowing deadlines", () => {
  for (const value of [-1, Number.POSITIVE_INFINITY, Number.NaN]) {
    assert.throws(() => makeCacheEntry(parsed, value, 0), /current time/i);
    assert.throws(() => makeCacheEntry(parsed, 0, value), /refresh delay/i);
  }
  assert.throws(() => makeCacheEntry(parsed, Number.MAX_SAFE_INTEGER, 1), /exceeds the safe numeric range/i);
});
