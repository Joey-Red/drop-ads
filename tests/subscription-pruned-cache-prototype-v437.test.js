import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/subscriptions.js", import.meta.url), "utf8");

test("M437 pruned list caches use an own-key null-prototype dictionary", () => {
  assert.match(source, /const pruned = Object\.create\(null\)/);
  assert.match(source, /Object\.hasOwn\(sourceCache, subscription\.id\)/);
  assert.match(source, /Object\.defineProperty\(pruned, subscription\.id,/);
  assert.doesNotMatch(source, /const pruned = \{\}/);
});

test("M437 prototype-like subscription ids remain representable as own data", () => {
  const cache = Object.create(null);
  Object.defineProperty(cache, "constructor", {
    value: { retained: true },
    enumerable: true,
    configurable: true,
    writable: true
  });
  assert.equal(Object.getPrototypeOf(cache), null);
  assert.equal(Object.hasOwn(cache, "constructor"), true);
  assert.deepEqual(cache.constructor, { retained: true });
});
