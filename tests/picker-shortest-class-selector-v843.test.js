import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M843 tries stable class prefixes from shortest to longest", () => {
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\)/);
  assert.match(source, /return tokens\.slice\(0, MAX_SELECTED_CLASS_TOKENS\)/);
  assert.match(source, /for \(let count = 1; count <= classes\.length; count \+= 1\)/);
  assert.match(source, /classes\.slice\(0, count\)/);
  assert.match(source, /candidates\.push\(\.\.\.stableClassSelectorCandidates\(element, tag\)\)/);
});
