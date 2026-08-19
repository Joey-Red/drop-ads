import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M869 snapshots picker siblings before nth-of-type fallback", () => {
  assert.match(source, /const siblingSnapshot = \[\]/);
  assert.match(source, /siblingSnapshot\.push\(sibling\)/);
  assert.match(source, /parent\.children !== children \|\| children\.length !== length/);
  assert.match(source, /children\[index\] !== siblingSnapshot\[index\]/);
  assert.match(source, /Picker sibling list changed during selection/);
  assert.match(source, /length > MAX_SIBLING_SCAN/);
});
