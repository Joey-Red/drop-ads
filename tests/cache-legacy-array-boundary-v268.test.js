import test from "node:test";
import assert from "node:assert/strict";

import { compactCacheEntry, decodeCacheEntry } from "../src/core/cache-codec.js";

test("legacy cache arrays reject accessors without executing them", () => {
  let calls = 0;
  const block = [];
  Object.defineProperty(block, "0", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return { kind: "domain", value: "ads.example" };
    }
  });
  block.length = 1;
  assert.equal(decodeCacheEntry({ block, allow: [], nextRefreshAt: 10 }), null);
  assert.equal(calls, 0);
});

test("legacy sparse policy arrays fail closed", () => {
  assert.equal(decodeCacheEntry({ block: new Array(1), allow: [], nextRefreshAt: 10 }), null);
});

test("valid legacy policy still migrates to the current compact cache", () => {
  const compact = compactCacheEntry({
    block: [{ kind: "domain", value: "Ads.Example" }],
    allow: [],
    cosmeticHide: [{ selector: ".ad" }],
    cosmeticAllow: [],
    nextRefreshAt: 123
  });
  assert.ok(compact);
  assert.equal(compact.v, 5);
  const decoded = decodeCacheEntry(compact);
  assert.equal(decoded.block[0].value, "ads.example");
  assert.equal(decoded.cosmeticHide[0].selector, ".ad");
  assert.equal(decoded.nextRefreshAt, 123);
});
