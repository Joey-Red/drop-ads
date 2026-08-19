import test from "node:test";
import assert from "node:assert/strict";
import {
  assertRawListCacheBound,
  serializedListCacheBytes
} from "../src/core/cache-storage.js";

function revokedProxy(target) {
  const pair = Proxy.revocable(target, {});
  pair.revoke();
  return pair.proxy;
}

test("M418 raw list-cache root contains revoked ordinary and array proxies", () => {
  assert.throws(
    () => assertRawListCacheBound(revokedProxy({})),
    /inspectable array kind/
  );
  assert.throws(
    () => assertRawListCacheBound(revokedProxy([])),
    /inspectable array kind/
  );
});

test("M418 nested list-cache JSON contains revoked ordinary and array proxies", () => {
  assert.throws(
    () => serializedListCacheBytes({ source: { value: revokedProxy({}) } }),
    /inspectable array kind/
  );
  assert.throws(
    () => serializedListCacheBytes({ source: { value: revokedProxy([]) } }),
    /inspectable array kind/
  );
});

test("M418 valid plain JSON cache data retains deterministic serialization", () => {
  const cache = {
    source: {
      schemaVersion: 5,
      counts: [1, 2, 3],
      nested: { enabled: true, refreshedAt: 0 }
    }
  };
  const first = serializedListCacheBytes(cache);
  const second = serializedListCacheBytes(cache);
  assert.equal(Number.isSafeInteger(first), true);
  assert.equal(first, second);
});
