import test from "node:test";
import assert from "node:assert/strict";
import { decodeCacheEntry, encodeCacheEntry } from "../src/core/cache-codec.js";

test("v5 decoded cache entries are frozen including source-bound identity", () => {
  const encoded = encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [{ selector: ".sponsor" }],
    cosmeticAllow: [],
    sourceKey: "hosts\u0000https://example.com/list.txt"
  }, 1234);
  const decoded = decodeCacheEntry(encoded);

  assert.ok(decoded);
  assert.equal(Object.isFrozen(decoded), true);
  assert.equal(decoded.sourceKey, "hosts\u0000https://example.com/list.txt");
  assert.equal(Object.isFrozen(decoded.block), true);
  assert.equal(Object.isFrozen(decoded.cosmeticHide), true);
  assert.throws(() => { decoded.nextRefreshAt = 99; }, TypeError);
});

test("legacy and historical decoded cache entries are frozen snapshots", () => {
  const v2 = decodeCacheEntry({
    v: 2,
    b: { d: ["ads.example.com"] },
    a: {},
    n: 50
  });
  assert.ok(v2);
  assert.equal(Object.isFrozen(v2), true);
  assert.equal(Object.isFrozen(v2.block), true);
  assert.equal(Object.isFrozen(v2.cosmeticHide), true);

  const legacy = decodeCacheEntry({
    block: [{ kind: "domain", value: "legacy.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 75
  });
  assert.ok(legacy);
  assert.equal(Object.isFrozen(legacy), true);
  assert.equal(Object.isFrozen(legacy.block), true);
  assert.throws(() => { legacy.sourceKey = "changed"; }, TypeError);
});
