import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 chooses the shortest deterministic stable class prefix that is unique", () => {
  assert.match(source, /function stableClassSelectorCandidates\(element, tag\)/);
  assert.match(source, /for \(let count = 1; count <= classes\.length; count \+= 1\)/);
  assert.match(source, /const suffix = classes\.slice\(0, count\)/);
  assert.match(source, /candidates\.push\(\.\.\.stableClassSelectorCandidates\(element, tag\)\)/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate/);
});
