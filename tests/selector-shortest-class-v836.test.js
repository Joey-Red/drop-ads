import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker tests deterministic class candidates from shortest to longest", () => {
  assert.match(source, /const MAX_SELECTED_CLASS_TOKENS = 3;/);
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\);/);
  assert.match(source, /return tokens\.slice\(0, MAX_SELECTED_CLASS_TOKENS\);/);
  assert.match(source, /function stableClassSelectorCandidates\(element, tag\)/);
  assert.match(source, /for \(let count = 1; count <= classes\.length; count \+= 1\)/);
  assert.match(source, /const suffix = classes\.slice\(0, count\)/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate;/);
  assert.match(source, /extensionOwnedClassToken\(token\)/);
});
