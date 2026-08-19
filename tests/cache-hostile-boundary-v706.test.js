import test from "node:test";
import assert from "node:assert/strict";
import { decodeCacheEntry } from "../src/core/cache-codec.js";

test("cache entry accessors are rejected without invocation", () => {
  let calls = 0;
  const entry = {};
  Object.defineProperty(entry, "block", {
    enumerable: true,
    get() {
      calls += 1;
      throw new Error("must not run");
    }
  });
  entry.allow = [];
  entry.cosmeticHide = [];
  entry.cosmeticAllow = [];

  assert.equal(decodeCacheEntry(entry), null);
  assert.equal(calls, 0);
});

test("nested hostile rule accessors fail closed while valid neighbors survive", () => {
  let calls = 0;
  const hostile = { kind: "domain" };
  Object.defineProperty(hostile, "value", {
    enumerable: true,
    get() {
      calls += 1;
      throw new Error("must not run");
    }
  });

  const decoded = decodeCacheEntry({
    block: [
      hostile,
      { kind: "domain", value: "ads.example.com" }
    ],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 1
  });

  assert.ok(decoded);
  assert.equal(calls, 0);
  assert.deepEqual(decoded.block, [{ kind: "domain", value: "ads.example.com" }]);
  assert.equal(Object.isFrozen(decoded), true);
  assert.equal(Object.isFrozen(decoded.block), true);
});

test("revoked proxy cache entries fail closed without escaping an exception", () => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.doesNotThrow(() => decodeCacheEntry(proxy));
  assert.equal(decodeCacheEntry(proxy), null);
});
