import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PERSISTED_LIST_CACHE_BYTES,
  MAX_RAW_LIST_CACHE_ENTRIES,
  assertListCacheStorageBound,
  assertRawListCacheBound,
  serializedListCacheBytes
} from "../src/core/cache-storage.js";
import { mergeCachedRules } from "../src/core/subscriptions.js";

function paddedCache(byteTarget) {
  const overhead = new TextEncoder().encode(JSON.stringify({ padding: "" })).byteLength;
  return { padding: "a".repeat(Math.max(0, byteTarget - overhead)) };
}

function cacheKeys(count) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => [`source-${index}`, {}]));
}

test("raw list cache accepts the exact entry ceiling and rejects one over before normalization", () => {
  assert.doesNotThrow(() => assertRawListCacheBound(cacheKeys(MAX_RAW_LIST_CACHE_ENTRIES)));
  assert.throws(() => assertRawListCacheBound(cacheKeys(MAX_RAW_LIST_CACHE_ENTRIES + 1)), /raw cache limit/);
});

test("raw list cache rejects malformed container shapes", () => {
  assert.throws(() => assertRawListCacheBound([]), /must be an object/);
  assert.throws(() => assertRawListCacheBound("cache"), /must be an object/);
  assert.throws(() => assertRawListCacheBound(Object.create({ inherited: true })), /plain object/);
  assert.deepEqual(assertRawListCacheBound(null), {});

  const nullPrototype = Object.assign(Object.create(null), { source: {} });
  assert.equal(assertRawListCacheBound(nullPrototype), nullPrototype);
});

test("raw list cache rejects hidden and executable own entries without invoking them", () => {
  const symbolCache = { source: {} };
  symbolCache[Symbol("hidden")] = {};
  assert.throws(() => assertRawListCacheBound(symbolCache), /symbol keys/);

  const nonEnumerable = {};
  Object.defineProperty(nonEnumerable, "source", { value: {}, enumerable: false });
  assert.throws(() => assertRawListCacheBound(nonEnumerable), /enumerable data fields/);

  let getterCalled = false;
  const accessor = {};
  Object.defineProperty(accessor, "source", {
    enumerable: true,
    get() {
      getterCalled = true;
      return {};
    }
  });
  assert.throws(() => assertRawListCacheBound(accessor), /data fields/);
  assert.equal(getterCalled, false);
});

test("list cache byte accounting is deterministic and accepts the exact ceiling", () => {
  const cache = paddedCache(MAX_PERSISTED_LIST_CACHE_BYTES);
  assert.equal(serializedListCacheBytes(cache), MAX_PERSISTED_LIST_CACHE_BYTES);
  assert.equal(assertListCacheStorageBound(cache), MAX_PERSISTED_LIST_CACHE_BYTES);
});

test("list cache rejects one byte over and counts UTF-8 bytes rather than JS code units", () => {
  const over = paddedCache(MAX_PERSISTED_LIST_CACHE_BYTES + 1);
  assert.equal(serializedListCacheBytes(over), MAX_PERSISTED_LIST_CACHE_BYTES + 1);
  assert.throws(() => assertListCacheStorageBound(over), /persisted cache limit/);
  assert.equal(serializedListCacheBytes({ value: "é" }) > JSON.stringify({ value: "é" }).length, true);
});

test("effective shared-policy merge rejects an over-budget candidate before decoding entries", () => {
  const over = paddedCache(MAX_PERSISTED_LIST_CACHE_BYTES + 1);
  assert.throws(() => mergeCachedRules([], over), /persisted cache limit/);
});
