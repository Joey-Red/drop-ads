import test from "node:test";
import assert from "node:assert/strict";
import {
  CACHE_ENTRY_VERSION,
  decodeCacheEntry,
  decodeRulePack,
  encodeCacheEntry
} from "../src/core/cache-codec.js";

test("versioned cache entries reject unknown fields instead of silently stripping them", () => {
  const cases = [
    { v: 2, b: { d: ["ads.example.com"] }, a: {}, n: 1, requestHistory: [] },
    { v: 3, b: { d: ["ads.example.com"] }, a: {}, h: [], x: [], n: 1, pageUrl: "https://example.com" },
    { v: 4, b: { d: ["ads.example.com"] }, a: {}, h: [], x: [], c: [1, 0, 0, 0], n: 1, analytics: true },
    { v: CACHE_ENTRY_VERSION, b: { d: ["ads.example.com"] }, a: {}, c: [1, 0, 0, 0], n: 1, telemetry: {} },
    { block: [{ kind: "domain", value: "ads.example.com" }], allow: [], nextRefreshAt: 1, history: [] }
  ];
  for (const entry of cases) assert.equal(decodeCacheEntry(entry), null);
});

test("packed rule objects reject unknown fields as a whole", () => {
  assert.deepEqual(decodeRulePack({ d: ["ads.example.com"], metadata: [] }), []);
  assert.deepEqual(decodeRulePack({ d: ["ads.example.com"], u: [], p: [], r: [] }), [
    { kind: "domain", value: "ads.example.com" }
  ]);
});

test("refresh metadata never invokes numeric coercion hooks", () => {
  let coercions = 0;
  const numericLike = {
    valueOf() { coercions += 1; return 123; },
    toString() { coercions += 1; return "123"; }
  };

  assert.deepEqual(decodeCacheEntry({ v: 2, b: { d: ["ads.example.com"] }, a: {}, n: numericLike }), {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  });
  assert.deepEqual(decodeCacheEntry({
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    nextRefreshAt: numericLike
  }), {
    block: [{ kind: "domain", value: "ads.example.com" }],
    allow: [],
    cosmeticHide: [],
    cosmeticAllow: [],
    nextRefreshAt: 0
  });

  const encoded = encodeCacheEntry({ block: [{ kind: "domain", value: "ads.example.com" }], allow: [] }, numericLike);
  assert.equal(encoded.n, 0);
  assert.equal(coercions, 0);
});

test("reviewed v2 through v5 and legacy shapes remain decodable", () => {
  assert.equal(decodeCacheEntry({ v: 2, b: { d: ["ads.example.com"] }, a: {}, n: 2 }).nextRefreshAt, 2);
  assert.equal(decodeCacheEntry({ v: 3, b: { d: ["ads.example.com"] }, a: {}, h: [], x: [], n: 3 }).nextRefreshAt, 3);
  assert.equal(decodeCacheEntry({ v: 4, b: { d: ["ads.example.com"] }, a: {}, h: [], x: [], c: [1, 0, 0, 0], n: 4 }).nextRefreshAt, 4);
  assert.equal(decodeCacheEntry({ v: 5, b: { d: ["ads.example.com"] }, a: {}, c: [1, 0, 0, 0], n: 5 }).nextRefreshAt, 5);
  assert.equal(decodeCacheEntry({ block: [{ kind: "domain", value: "ads.example.com" }], allow: [], nextRefreshAt: 6 }).nextRefreshAt, 6);
});
