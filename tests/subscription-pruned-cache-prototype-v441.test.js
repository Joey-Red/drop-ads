import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/subscriptions.js", import.meta.url), "utf8");

test("M441 pruneListCache builds a null-prototype cache and uses own-key admission", () => {
  assert.match(source, /const pruned = Object\.create\(null\);/);
  assert.match(source, /if \(!Object\.hasOwn\(sourceCache, subscription\.id\)\) continue;/);
  assert.match(source, /Object\.defineProperty\(pruned, subscription\.id,/);
  assert.doesNotMatch(source, /const pruned = \{\};/);
});

test("M441 prototype-sensitive subscription ids are written as inert own properties", () => {
  assert.match(source, /value: rawEntry,/);
  assert.match(source, /enumerable: true,/);
  assert.match(source, /writable: true/);
});
