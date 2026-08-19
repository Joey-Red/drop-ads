import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_LIST_CACHE_JSON_DEPTH,
  serializedListCacheBytes
} from "../src/core/cache-storage.js";

test("list-cache serialization rejects nested accessors without invoking getters", () => {
  let reads = 0;
  const entry = {};
  Object.defineProperty(entry, "v", {
    enumerable: true,
    get() {
      reads += 1;
      return 5;
    }
  });
  assert.throws(() => serializedListCacheBytes({ source: entry }), /enumerable data field/);
  assert.equal(reads, 0);
});

test("list-cache serialization never invokes toJSON or coercion hooks", () => {
  let calls = 0;
  const entry = { v: 5, n: 0, toJSON() { calls += 1; return { v: 5 }; } };
  assert.throws(() => serializedListCacheBytes({ source: entry }), /JSON data only/);
  assert.equal(calls, 0);
});

test("list-cache serialization rejects cycles and malformed arrays", () => {
  const entry = { v: 5 };
  entry.self = entry;
  assert.throws(() => serializedListCacheBytes({ source: entry }), /nodes|depth/);

  const sparse = new Array(2);
  sparse[0] = "x";
  assert.throws(() => serializedListCacheBytes({ source: { values: sparse } }), /dense array indices|enumerable data entries/);
});

test("list-cache serialization rejects non-finite and non-JSON primitive values", () => {
  assert.throws(() => serializedListCacheBytes({ source: { n: Number.POSITIVE_INFINITY } }), /finite JSON numbers/);
  assert.throws(() => serializedListCacheBytes({ source: { n: undefined } }), /JSON data only/);
  assert.throws(() => serializedListCacheBytes({ source: { n: 1n } }), /JSON data only/);
});

test("valid compact cache data retains normal JSON UTF-8 byte accounting", () => {
  const cache = { source: { v: 5, b: { d: ["ads.example.com"] }, a: {}, c: [1, 0, 0, 0], s: "hosts\u0000https://example.com/hosts", n: 1234 } };
  assert.equal(serializedListCacheBytes(cache), new TextEncoder().encode(JSON.stringify(cache)).byteLength);
});

test("list-cache serialization applies a bounded recursion depth", () => {
  let value = { leaf: true };
  for (let index = 0; index < MAX_LIST_CACHE_JSON_DEPTH + 2; index += 1) value = { next: value };
  assert.throws(() => serializedListCacheBytes({ source: value }), /depth/);
});
