import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_LIST_CACHE_KEY_CHARS,
  assertRawListCacheBound,
  isCanonicalListCacheKey
} from "../src/core/cache-storage.js";

test("list cache keys accept the exact subscription-id ceiling and reject one over", () => {
  const exact = `a${"b".repeat(MAX_LIST_CACHE_KEY_CHARS - 1)}`;
  const over = `a${"b".repeat(MAX_LIST_CACHE_KEY_CHARS)}`;
  assert.equal(exact.length, MAX_LIST_CACHE_KEY_CHARS);
  assert.equal(isCanonicalListCacheKey(exact), true);
  assert.doesNotThrow(() => assertRawListCacheBound({ [exact]: {} }));
  assert.equal(isCanonicalListCacheKey(over), false);
  assert.throws(() => assertRawListCacheBound({ [over]: {} }), /canonical subscription-id syntax/i);
});

test("list cache keys reject empty, whitespace, control, and invalid-leading syntax", () => {
  for (const key of ["", " bad", "bad key", "-bad", "_bad", ".bad", "bad\nkey", "bad/key"]) {
    assert.equal(isCanonicalListCacheKey(key), false, key);
    assert.throws(() => assertRawListCacheBound({ [key]: {} }), /canonical subscription-id syntax/i);
  }
});

test("normal built-in and external-style cache ids remain canonical", () => {
  for (const key of ["drop-ads-default", "hagezi-pro-mini", "my.custom-list_1", "vendor-list.v2"]) {
    assert.equal(isCanonicalListCacheKey(key), true);
    assert.equal(assertRawListCacheBound({ [key]: {} })[key] instanceof Object, true);
  }
});

test("invalid cache key rejection does not invoke its entry accessor", () => {
  let reads = 0;
  const cache = {};
  Object.defineProperty(cache, "bad key", {
    enumerable: true,
    get() { reads += 1; return {}; }
  });
  assert.throws(() => assertRawListCacheBound(cache), /canonical subscription-id syntax/i);
  assert.equal(reads, 0);
});
