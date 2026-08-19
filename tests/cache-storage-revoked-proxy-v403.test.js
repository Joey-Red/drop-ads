import test from "node:test";
import assert from "node:assert/strict";

import {
  assertRawListCacheBound,
  serializedListCacheBytes
} from "../src/core/cache-storage.js";

function revokedProxy(target) {
  const { proxy, revoke } = Proxy.revocable(target, {});
  revoke();
  return proxy;
}

test("M403 revoked raw cache roots fail through the reviewed cache boundary", () => {
  assert.throws(() => assertRawListCacheBound(revokedProxy({})), /inspectable array kind/);
  assert.throws(() => assertRawListCacheBound(revokedProxy([])), /inspectable array kind/);
});

test("M403 revoked nested cache JSON values fail deterministically", () => {
  assert.throws(
    () => serializedListCacheBytes({ source: revokedProxy({}) }),
    /List cache\.source must have an inspectable array kind/
  );
  assert.throws(
    () => serializedListCacheBytes({ source: revokedProxy([]) }),
    /List cache\.source must have an inspectable array kind/
  );
});

test("M403 ordinary cache JSON semantics remain available", () => {
  assert.equal(serializedListCacheBytes({ source: { values: [1, true, "x", null] } }) > 0, true);
});
