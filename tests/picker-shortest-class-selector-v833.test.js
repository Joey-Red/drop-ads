import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M833 tries deterministic class prefixes shortest first", () => {
  assert.match(source, /function stableClassSelectorCandidates\(element, tag\)/);
  assert.match(source, /for \(let count = 1; count <= classes\.length; count \+= 1\)/);
  assert.match(source, /classes\.slice\(0, count\)/);
  assert.match(source, /candidates\.push\(`\$\{tag\}\$\{suffix\}`\)/);
  assert.match(source, /candidates\.push\(\.\.\.stableClassSelectorCandidates\(element, tag\)\)/);
});
