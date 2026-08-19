import assert from "node:assert/strict";
import test from "node:test";

import { MAX_RAW_CACHE_POLICY_ITEMS, compactCacheEntry, decodeCacheEntry, encodeCacheEntry } from "../src/core/cache-codec.js";

function rule(index = 0) {
  return { kind: "domain", value: `ad${index}.example.com` };
}

test("encodeCacheEntry rejects root accessors and unknown fields without invoking getters", () => {
  let reads = 0;
  const candidate = { allow: [] };
  Object.defineProperty(candidate, "block", {
    enumerable: true,
    get() {
      reads += 1;
      return [rule()];
    }
  });
  assert.throws(() => encodeCacheEntry(candidate, 1_000), /plain-data cache encoding schema/);
  assert.equal(reads, 0);
  assert.throws(
    () => encodeCacheEntry({ block: [rule()], allow: [], requestHistory: [] }, 1_000),
    /plain-data cache encoding schema/
  );
});

test("encodeCacheEntry requires dense detached policy arrays", () => {
  const sparse = new Array(1);
  assert.throws(() => encodeCacheEntry({ block: sparse, allow: [] }, 1_000), /enumerable data entries/);

  const accessor = [rule()];
  let reads = 0;
  Object.defineProperty(accessor, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return rule();
    }
  });
  assert.throws(() => encodeCacheEntry({ block: accessor, allow: [] }, 1_000), /enumerable data entries/);
  assert.equal(reads, 0);
});

test("encodeCacheEntry enforces the total raw cache policy ceiling before normalization", () => {
  const block = Array.from({ length: MAX_RAW_CACHE_POLICY_ITEMS }, () => rule(0));
  assert.doesNotThrow(() => encodeCacheEntry({ block, allow: [] }, 1_000));
  assert.throws(
    () => encodeCacheEntry({ block, allow: [rule(1)] }, 1_000),
    /cache encode limit/
  );
});

test("encodeCacheEntry preserves optional cosmetics and public source identity", () => {
  const entry = encodeCacheEntry({
    block: [rule()],
    allow: [],
    cosmeticHide: [{ selector: ".sponsor" }],
    sourceKey: "hosts\u0000https://example.com/hosts"
  }, 1_000);
  assert.equal(entry.v, 5);
  assert.equal(entry.s, "hosts\u0000https://example.com/hosts");
  assert.deepEqual(entry.c, [1, 0, 1, 0]);
});

test("compactCacheEntry preserves schedule and source identity through the exact encode boundary", () => {
  const source = encodeCacheEntry({
    block: [rule()],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    sourceKey: "hosts\u0000https://example.com/hosts"
  }, 1_234);
  const compacted = compactCacheEntry(source);
  assert.ok(compacted);
  assert.equal(compacted.n, 1_234);
  assert.equal(compacted.s, "hosts\u0000https://example.com/hosts");
  assert.deepEqual(compacted.c, [1, 0, 0, 0]);
  assert.deepEqual(decodeCacheEntry(compacted), decodeCacheEntry(source));
});

test("legacy cache compaction passes refresh metadata separately from the exact encode candidate", () => {
  const legacy = {
    block: [rule()],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 4_321
  };
  const compacted = compactCacheEntry(legacy);
  assert.ok(compacted);
  assert.equal(compacted.v, 5);
  assert.equal(compacted.n, 4_321);
  assert.deepEqual(compacted.c, [1, 0, 0, 0]);
});
