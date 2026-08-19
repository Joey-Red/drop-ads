import assert from "node:assert/strict";
import test from "node:test";

import { cacheNextRefreshAt, encodeCacheEntry } from "../src/core/cache-codec.js";

const SOURCE_KEY = "hosts\u0000https://example.com/list.txt";

function validEntry(nextRefreshAt = 123_456) {
  return encodeCacheEntry({
    block: [{ kind: "domain", value: "example.com" }],
    allow: [],
    sourceKey: SOURCE_KEY
  }, nextRefreshAt);
}

test("cacheNextRefreshAt trusts a fully valid source-bound v5 entry", () => {
  assert.equal(cacheNextRefreshAt(validEntry()), 123_456);
});

test("cacheNextRefreshAt does not trust tampered policy counts", () => {
  const entry = validEntry();
  entry.c = [2, 0, 0, 0];
  assert.equal(cacheNextRefreshAt(entry), 0);
});

test("cacheNextRefreshAt does not trust semantically invalid packed policy", () => {
  const entry = validEntry();
  entry.b = { d: ["localhost"] };
  entry.c = [1, 0, 0, 0];
  assert.equal(cacheNextRefreshAt(entry), 0);
});

test("cacheNextRefreshAt keeps invalid or missing source identity stale", () => {
  const invalidSource = validEntry();
  invalidSource.s = "hosts\u0000http://example.com/list.txt";
  assert.equal(cacheNextRefreshAt(invalidSource), 0);

  const unbound = validEntry();
  delete unbound.s;
  assert.equal(cacheNextRefreshAt(unbound), 0);
});

test("cacheNextRefreshAt keeps legacy cache freshness unknown", () => {
  const legacy = { v: 4, b: { d: ["example.com"] }, a: {}, c: [1, 0, 0, 0], n: 123_456 };
  assert.equal(Number.isNaN(cacheNextRefreshAt(legacy)), true);
});
