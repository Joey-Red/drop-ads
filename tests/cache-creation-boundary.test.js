import assert from "node:assert/strict";
import test from "node:test";

import { MAX_RAW_CACHE_POLICY_ITEMS } from "../src/core/cache-codec.js";
import { makeCacheEntry } from "../src/core/list-updates.js";

const rule = { kind: "domain", value: "ads.example" };

test("makeCacheEntry rejects parsed-policy accessors without invoking getters", () => {
  let reads = 0;
  const parsed = { allow: [] };
  Object.defineProperty(parsed, "block", {
    enumerable: true,
    get() {
      reads += 1;
      return [rule];
    }
  });

  assert.throws(() => makeCacheEntry(parsed, 1, 1), /data field/);
  assert.equal(reads, 0);
});

test("makeCacheEntry enforces an exact plain-data root schema", () => {
  assert.throws(() => makeCacheEntry({ block: [rule], allow: [], requestHistory: [] }, 1, 1), /unsupported field/);
  assert.throws(() => makeCacheEntry([], 1, 1), /plain object/);
  assert.throws(() => makeCacheEntry(Object.create({ block: [rule], allow: [] }), 1, 1), /plain object/);
  assert.throws(() => makeCacheEntry({ block: [rule] }, 1, 1), /requires block and allow/);
});

test("makeCacheEntry validates dense policy arrays before encoding", () => {
  const sparse = new Array(1);
  assert.throws(() => makeCacheEntry({ block: sparse, allow: [] }, 1, 1), /enumerable data entries/);

  let reads = 0;
  const block = [rule];
  Object.defineProperty(block, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return rule;
    }
  });
  assert.throws(() => makeCacheEntry({ block, allow: [] }, 1, 1), /enumerable data entries/);
  assert.equal(reads, 0);
});

test("makeCacheEntry enforces the aggregate 300000 raw-policy work ceiling", () => {
  const first = Array(MAX_RAW_CACHE_POLICY_ITEMS / 2 + 1).fill(rule);
  const second = Array(MAX_RAW_CACHE_POLICY_ITEMS / 2).fill(rule);
  assert.throws(
    () => makeCacheEntry({ block: first, allow: second }, 1, 1),
    /300001 raw policy items/
  );
});

test("makeCacheEntry defaults omitted cosmetics and preserves source identity", () => {
  const entry = makeCacheEntry({
    block: [rule],
    allow: [],
    sourceKey: "third-party\u0000https://example.com/list.txt"
  }, 10, 20);

  assert.equal(entry.v, 5);
  assert.equal(entry.n, 30);
  assert.equal(entry.s, "third-party\u0000https://example.com/list.txt");
  assert.deepEqual(entry.c, [1, 0, 0, 0]);
});
