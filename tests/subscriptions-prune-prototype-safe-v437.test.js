import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/subscriptions.js", import.meta.url), "utf8");

test("M437 pruned subscription caches use null-prototype ownership", () => {
  assert.match(source, /export function pruneListCache\(subscriptions, cache\) \{[\s\S]*?const pruned = Object\.create\(null\);/);
  assert.match(source, /Object\.hasOwn\(sourceCache, subscription\.id\)/);
  assert.match(source, /Object\.defineProperty\(pruned, subscription\.id,/);
  assert.doesNotMatch(source, /const pruned = \{\};/);
});

test("M437 prototype-like subscription ids remain own cache keys", () => {
  const pruned = Object.create(null);
  Object.defineProperty(pruned, "constructor", {
    value: { marker: true },
    enumerable: true,
    configurable: true,
    writable: true
  });
  assert.equal(Object.getPrototypeOf(pruned), null);
  assert.equal(Object.hasOwn(pruned, "constructor"), true);
  assert.deepEqual(pruned.constructor, { marker: true });
});
