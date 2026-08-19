import test from "node:test";
import assert from "node:assert/strict";
import {
  assertRawCacheEntryWorkBound,
  rawCacheEntryItemCount
} from "../src/core/cache-codec.js";

function legacyEntry(overrides = {}) {
  return {
    block: [],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0,
    ...overrides
  };
}

test("revoked legacy policy arrays invalidate the entry without leaking revocation errors", () => {
  const revocable = Proxy.revocable([], {});
  revocable.revoke();
  const entry = legacyEntry({ block: revocable.proxy });

  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.throws(
    () => assertRawCacheEntryWorkBound(entry),
    /exact plain-data cache schema/
  );
});

test("sparse legacy arrays fail the dense admission boundary", () => {
  const sparse = new Array(2);
  sparse[1] = { selector: "#ad" };
  const entry = legacyEntry({ cosmeticHide: sparse });

  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.throws(
    () => assertRawCacheEntryWorkBound(entry),
    /exact plain-data cache schema/
  );
});

test("ordinary non-array legacy fields retain compatibility fallback semantics", () => {
  const entry = legacyEntry({ block: null, allow: "legacy-missing-array" });
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.equal(assertRawCacheEntryWorkBound(entry), 0);
});
