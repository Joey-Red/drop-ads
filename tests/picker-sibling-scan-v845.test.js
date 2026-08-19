import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M845 bounds structural sibling scanning and fails closed", () => {
  assert.match(source, /const MAX_SIBLING_SCAN = 10_000/);
  assert.match(source, /Picker sibling list is unavailable/);
  assert.match(source, /Picker sibling list is invalid/);
  assert.match(source, /length > MAX_SIBLING_SCAN/);
  assert.match(source, /Picker target is no longer attached to its parent/);
});
