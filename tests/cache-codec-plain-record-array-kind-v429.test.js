import test from "node:test";
import assert from "node:assert/strict";

import { decodeCacheEntry, encodeCacheEntry } from "../src/core/cache-codec.js";

function revoked(value) {
  const { proxy, revoke } = Proxy.revocable(value, {});
  revoke();
  return proxy;
}

test("M429 cache decode contains revoked root record array-kind failures", () => {
  assert.doesNotThrow(() => assert.equal(decodeCacheEntry(revoked({})), null));
  assert.doesNotThrow(() => assert.equal(decodeCacheEntry(revoked([])), null));
});

test("M429 cache encode converts revoked root record metadata into the reviewed schema failure", () => {
  assert.throws(
    () => encodeCacheEntry(revoked({}), 0),
    /Parsed list must match the exact plain-data cache encoding schema/
  );
  assert.throws(
    () => encodeCacheEntry(revoked([]), 0),
    /Parsed list must match the exact plain-data cache encoding schema/
  );
});
