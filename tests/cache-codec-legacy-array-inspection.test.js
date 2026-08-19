import test from "node:test";
import assert from "node:assert/strict";

import {
  assertRawCacheEntryWorkBound,
  rawCacheEntryItemCount
} from "../src/core/cache-codec.js";

function revokedArray() {
  const pair = Proxy.revocable([], {});
  pair.revoke();
  return pair.proxy;
}

test("legacy cache revoked array-kind values invalidate the entry without native revocation leakage", () => {
  const entry = {
    block: revokedArray(),
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.throws(() => assertRawCacheEntryWorkBound(entry), /exact plain-data cache schema/);
});

test("legacy work counting never uses normal length getters after dense detachment", () => {
  let normalLengthReads = 0;
  const source = new Proxy(["a", "b"], {
    get(target, property, receiver) {
      if (property === "length") normalLengthReads += 1;
      return Reflect.get(target, property, receiver);
    }
  });
  const entry = {
    block: source,
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  };
  assert.equal(rawCacheEntryItemCount(entry), 2);
  assert.equal(normalLengthReads, 0);
});

test("ordinary non-array legacy fields retain the existing compatibility fallback", () => {
  const entry = { block: "legacy-non-array", nextRefreshAt: 0 };
  assert.equal(rawCacheEntryItemCount(entry), 0);
  assert.equal(assertRawCacheEntryWorkBound(entry), 0);
});
