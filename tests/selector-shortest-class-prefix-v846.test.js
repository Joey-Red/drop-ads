import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M846 direct class candidates are shortest deterministic stable prefixes", () => {
  assert.match(source, /tokens\.sort\(fixedCodeUnitCompare\)/);
  assert.match(source, /return tokens\.slice\(0, MAX_SELECTED_CLASS_TOKENS\);/);
  assert.match(source, /for \(let count = 1; count <= classes\.length; count \+= 1\)/);
  assert.match(source, /const suffix = classes\.slice\(0, count\)/);
  assert.match(source, /candidates\.push\(`\$\{tag\}\$\{suffix\}`\);/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate;/);
});
