import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M843 excludes duplicate target and ancestor ids from structural picker paths", () => {
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /function stableIdIsUnique\(element, documentRef, probe = unique\)/);
  assert.match(source, /return Boolean\(id\) && probe\(documentRef, `#\$\{cssEscape\(id\)\}`, element\)/);
  assert.doesNotMatch(source, /if \(part\.startsWith\("#"\)\) break/);
});
