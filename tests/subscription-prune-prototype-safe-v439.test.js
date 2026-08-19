import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/subscriptions.js", import.meta.url), "utf8");

test("M439 pruned subscription caches use a null-prototype dictionary", () => {
  assert.match(source, /export function pruneListCache\(subscriptions, cache\) \{[\s\S]*const pruned = Object\.create\(null\)/);
  assert.match(source, /Object\.hasOwn\(sourceCache, subscription\.id\)/);
  assert.match(source, /Object\.defineProperty\(pruned, subscription\.id,/);
});

test("M439 pruning does not rely on inherited source-cache lookup", () => {
  const pruneBody = source.match(/export function pruneListCache\(subscriptions, cache\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.doesNotMatch(pruneBody, /if \(sourceCache\[subscription\.id\]\)/);
  assert.doesNotMatch(pruneBody, /const pruned = \{\}/);
});
