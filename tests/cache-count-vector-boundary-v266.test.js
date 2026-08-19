import test from "node:test";
import assert from "node:assert/strict";

import { decodeCacheEntry, encodeCacheEntry, MAX_RAW_CACHE_POLICY_ITEMS } from "../src/core/cache-codec.js";

function validEntry() {
  return encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example" }],
    allow: []
  }, 1234);
}

test("valid encoded count vectors still decode", () => {
  const entry = validEntry();
  const decoded = decodeCacheEntry(entry);
  assert.ok(decoded);
  assert.equal(decoded.block.length, 1);
});

test("unsafe, fractional, and infinite cache counts fail closed", () => {
  for (const count of [Number.MAX_SAFE_INTEGER + 1, 1.5, Number.POSITIVE_INFINITY]) {
    const entry = validEntry();
    entry.c = [count, 0, 0, 0];
    assert.equal(decodeCacheEntry(entry), null);
  }
});

test("individual and combined count vectors cannot exceed the raw policy ceiling", () => {
  const oneOver = validEntry();
  oneOver.c = [MAX_RAW_CACHE_POLICY_ITEMS + 1, 0, 0, 0];
  assert.equal(decodeCacheEntry(oneOver), null);

  const combinedOver = validEntry();
  combinedOver.c = [MAX_RAW_CACHE_POLICY_ITEMS, 1, 0, 0];
  assert.equal(decodeCacheEntry(combinedOver), null);
});
