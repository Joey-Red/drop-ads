import test from "node:test";
import assert from "node:assert/strict";

import {
  assertRawCacheEntryWorkBound,
  encodeCacheEntry,
  rawCacheEntryItemCount
} from "../src/core/cache-codec.js";

function revoked(value) {
  const pair = Proxy.revocable(value, {});
  pair.revoke();
  return pair.proxy;
}

for (const [label, value] of [
  ["object", revoked({})],
  ["array", revoked([])]
]) {
  test(`cache codec fails closed for revoked ${label} record admission`, () => {
    assert.equal(rawCacheEntryItemCount(value), 0);
    assert.throws(
      () => assertRawCacheEntryWorkBound(value),
      /exact plain-data cache schema/
    );
    assert.throws(
      () => encodeCacheEntry(value, 0),
      /exact plain-data cache encoding schema/
    );
  });
}
