import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M835 duplicate target and ancestor ids never become unverified selector anchors", () => {
  assert.match(source, /function stableIdIsUnique\(element, documentRef, probe = unique\)/);
  assert.match(source, /return Boolean\(id\) && probe\(documentRef, `#\$\{cssEscape\(id\)\}`, element\)/);
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /const part = nthPart\(current, includeId\)/);
  assert.match(source, /probe\(documentRef, selector, element\)/);
  assert.match(source, /const MAX_SELECTOR_LENGTH = 400;/);
  assert.match(source, /const MAX_DEPTH = 5;/);
  assert.match(source, /const MAX_SIBLING_SCAN = 10_000;/);
});
