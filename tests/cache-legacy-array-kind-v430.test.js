import test from "node:test";
import assert from "node:assert/strict";

import {
  assertRawCacheEntryWorkBound,
  rawCacheEntryItemCount
} from "../src/core/cache-codec.js";

test("M430 revoked legacy policy arrays invalidate the cache entry without leaking revocation", () => {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  const entry = {
    block: proxy,
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };

  assert.doesNotThrow(() => rawCacheEntryItemCount(entry));
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.throws(
    () => assertRawCacheEntryWorkBound(entry),
    /exact plain-data cache schema/
  );
});

test("M430 ordinary non-array legacy policy fields retain compatibility fallback", () => {
  const entry = {
    block: null,
    allow: "legacy-non-array",
    cosmeticHide: undefined,
    cosmeticAllow: false,
    nextRefreshAt: 0
  };

  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.equal(assertRawCacheEntryWorkBound(entry), 0);
});
