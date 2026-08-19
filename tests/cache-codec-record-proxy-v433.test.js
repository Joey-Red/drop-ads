import test from "node:test";
import assert from "node:assert/strict";
import { decodeCacheEntry, encodeCacheEntry } from "../src/core/cache-codec.js";

function revokedProxy(target) {
  const pair = Proxy.revocable(target, {});
  pair.revoke();
  return pair.proxy;
}

test("M433 revoked cache-entry records fail closed without leaking native revocation errors", () => {
  assert.equal(decodeCacheEntry(revokedProxy({})), null);
  assert.equal(decodeCacheEntry(revokedProxy([])), null);
});

test("M433 revoked encode records fail through the reviewed cache-input boundary", () => {
  assert.throws(
    () => encodeCacheEntry(revokedProxy({ block: [], allow: [] }), 0),
    /Parsed cache policy|cache/i
  );
});
