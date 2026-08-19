import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M845 nth-of-type identity fails closed on a changing sibling list", () => {
  assert.match(source, /const siblingSnapshot = \[\];/);
  assert.match(source, /siblingSnapshot\.push\(sibling\)/);
  assert.match(source, /if \(parent\.children !== children \|\| children\.length !== length\) throw new Error\("Picker sibling list changed during selection"\);/);
  assert.match(source, /if \(children\[index\] !== siblingSnapshot\[index\]\) throw new Error\("Picker sibling list changed during selection"\);/);
  assert.match(source, /if \(length > MAX_SIBLING_SCAN\) throw new Error/);
});
