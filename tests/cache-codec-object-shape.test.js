import test from "node:test";
import assert from "node:assert/strict";
import {
  assertRawCacheEntryWorkBound,
  decodeCacheEntry,
  decodeRulePack,
  encodeCacheEntry
} from "../src/core/cache-codec.js";

test("cache entry accessors are rejected without invocation", () => {
  let reads = 0;
  const entry = {};
  Object.defineProperty(entry, "v", {
    enumerable: true,
    get() { reads += 1; return 5; }
  });
  assert.equal(decodeCacheEntry(entry), null);
  assert.throws(() => assertRawCacheEntryWorkBound(entry), /exact plain-data cache schema/i);
  assert.equal(reads, 0);
});

test("cache entry rejects custom prototypes and symbol fields", () => {
  assert.equal(decodeCacheEntry(Object.create({ v: 2 })), null);
  const symbolEntry = { v: 2, b: {}, a: {}, n: 0 };
  symbolEntry[Symbol("hidden")] = true;
  assert.equal(decodeCacheEntry(symbolEntry), null);
});

test("packed rule objects reject accessors and custom prototypes without invocation", () => {
  let reads = 0;
  const accessorPack = {};
  Object.defineProperty(accessorPack, "d", {
    enumerable: true,
    get() { reads += 1; return ["ads.example.com"]; }
  });
  assert.deepEqual(decodeRulePack(accessorPack), []);
  assert.equal(reads, 0);

  assert.deepEqual(decodeRulePack(Object.create({ d: ["ads.example.com"] })), []);
  const symbolPack = { d: ["ads.example.com"] };
  symbolPack[Symbol("hidden")] = true;
  assert.deepEqual(decodeRulePack(symbolPack), []);
});

test("null-prototype packed rule objects remain valid plain data", () => {
  const pack = Object.assign(Object.create(null), { d: ["ads.example.com"] });
  assert.deepEqual(decodeRulePack(pack), [{ kind: "domain", value: "ads.example.com" }]);
});

test("valid v2 and current v5 cache formats retain migration behavior", () => {
  assert.deepEqual(decodeCacheEntry({ v: 2, b: { d: ["ads.example.com"] }, a: {}, n: 123 }), {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 123
  });

  const encoded = encodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    sourceKey: "hosts\u0000https://filters.example/list.txt"
  }, 456);
  assert.deepEqual(decodeCacheEntry(encoded), {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 456,
    sourceKey: "hosts\u0000https://filters.example/list.txt"
  });
});
