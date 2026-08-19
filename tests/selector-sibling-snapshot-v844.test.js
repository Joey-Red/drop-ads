import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 nth-of-type uses one bounded stable sibling snapshot", () => {
  assert.match(source, /MAX_SIBLING_SCAN = 10_000/);
  assert.match(source, /const siblingSnapshot = \[\]/);
  assert.match(source, /siblingSnapshot\.push\(sibling\)/);
  assert.match(source, /parent\.children !== children \|\| children\.length !== length/);
  assert.match(source, /children\[index\] !== siblingSnapshot\[index\]/);
  assert.match(source, /Picker sibling list changed during selection/);
});
