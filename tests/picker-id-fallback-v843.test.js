import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("duplicate target IDs are dropped while ancestor IDs require budgeted uniqueness", () => {
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true;/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\);/);
  assert.match(source, /function stableIdIsUnique\(element, documentRef, probe = unique\)/);
  assert.match(source, /probe\(documentRef, `#\$\{cssEscape\(id\)\}`, element\)/);
  assert.match(source, /const MAX_DEPTH = 5;/);
  assert.match(source, /const MAX_SIBLING_SCAN = 10_000;/);
});
