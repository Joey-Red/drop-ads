import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/subscriptions.js", import.meta.url), "utf8");

test("M439 pruneListCache builds a null-prototype cache", () => {
  const start = source.indexOf("export function pruneListCache(subscriptions, cache)");
  assert.notEqual(start, -1);
  const block = source.slice(start, source.indexOf("function safeArrayCandidate", start));
  assert.match(block, /const pruned = Object\.create\(null\);/);
  assert.match(block, /Object\.hasOwn\(sourceCache, subscription\.id\)/);
  assert.match(block, /Object\.defineProperty\(pruned, subscription\.id,/);
  assert.doesNotMatch(block, /const pruned = \{\}/);
});

test("M439 pruned cache does not rely on Object prototype membership", () => {
  const start = source.indexOf("export function pruneListCache(subscriptions, cache)");
  const block = source.slice(start, source.indexOf("function safeArrayCandidate", start));
  assert.doesNotMatch(block, /subscription\.id in sourceCache/);
  assert.doesNotMatch(block, /sourceCache\.hasOwnProperty/);
});
