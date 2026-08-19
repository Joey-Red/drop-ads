import test from "node:test";
import assert from "node:assert/strict";
import { MAX_REFRESH_DEFERRAL_MS, isRefreshDue, makeCacheEntry } from "../src/core/list-updates.js";

const parsed = {
  block: [{ kind: "domain", value: "ads.example.com" }],
  allow: [],
  sourceKey: "hosts\u0000https://example.com/hosts.txt"
};

test("refresh due preserves current, exact due, and far-future behavior", () => {
  const current = 1_000;
  const entry = makeCacheEntry(parsed, current, 10_000);
  assert.equal(isRefreshDue(entry, current), false);
  assert.equal(isRefreshDue(entry, current + 10_000), true);

  const farFuture = makeCacheEntry(parsed, current, MAX_REFRESH_DEFERRAL_MS + 1);
  assert.equal(isRefreshDue(farFuture, current), true);
});

test("refresh due treats type-confused clocks conservatively without coercion", () => {
  const entry = makeCacheEntry(parsed, 1_000, 10_000);
  assert.equal(isRefreshDue(entry, "1000"), true);

  let coercions = 0;
  const coercive = {
    valueOf() { coercions += 1; return 1_000; },
    toString() { coercions += 1; return "1000"; }
  };
  assert.equal(isRefreshDue(entry, coercive), true);
  assert.equal(coercions, 0);
});

test("refresh due treats invalid or unsafe numeric clocks as due", () => {
  const entry = makeCacheEntry(parsed, 1_000, 10_000);
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(isRefreshDue(entry, value), true);
  }
});
