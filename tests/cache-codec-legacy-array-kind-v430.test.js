import test from "node:test";
import assert from "node:assert/strict";

import {
  assertRawCacheEntryWorkBound,
  decodeCacheEntry,
  rawCacheEntryItemCount
} from "../src/core/cache-codec.js";

function revoked(value) {
  const { proxy, revoke } = Proxy.revocable(value, {});
  revoke();
  return proxy;
}

test("M430 revoked legacy policy collections fail closed without native revocation errors", () => {
  for (const key of ["block", "allow", "cosmeticHide", "cosmeticAllow"]) {
    const entry = { block: [], allow: [], cosmeticHide: [], cosmeticAllow: [], nextRefreshAt: 0 };
    entry[key] = revoked([]);
    assert.doesNotThrow(() => assert.equal(decodeCacheEntry(entry), null));
    assert.doesNotThrow(() => assert.equal(rawCacheEntryItemCount(entry), 0));
    assert.throws(
      () => assertRawCacheEntryWorkBound(entry),
      /Cache entry must match an exact plain-data cache schema/
    );
  }
});

test("M430 ordinary non-array legacy policy fields keep compatibility fallback", () => {
  const decoded = decodeCacheEntry({
    block: [],
    allow: [],
    cosmeticHide: "legacy-noise",
    cosmeticAllow: 17,
    nextRefreshAt: 0
  });
  assert.ok(decoded);
  assert.deepEqual(decoded.block, []);
  assert.deepEqual(decoded.allow, []);
  assert.deepEqual(decoded.cosmeticHide, []);
  assert.deepEqual(decoded.cosmeticAllow, []);
});
