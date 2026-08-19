import test from "node:test";
import assert from "node:assert/strict";
import { assertRawCacheEntryWorkBound, rawCacheEntryItemCount } from "../src/core/cache-codec.js";

function revokedArrayProxy() {
  const { proxy, revoke } = Proxy.revocable([], {});
  revoke();
  return proxy;
}

test("revoked legacy policy arrays invalidate the entry without leaking proxy failures", () => {
  const entry = {
    block: revokedArrayProxy(),
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.throws(
    () => assertRawCacheEntryWorkBound(entry),
    /exact plain-data cache schema/
  );
});

test("legacy dense policy work remains counted from admitted arrays", () => {
  const entry = {
    block: [{ kind: "domain", value: "ads.example" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };
  assert.equal(rawCacheEntryItemCount(entry), 1);
  assert.equal(assertRawCacheEntryWorkBound(entry), 1);
});
