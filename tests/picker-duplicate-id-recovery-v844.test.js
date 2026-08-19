import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 recovers from duplicate target IDs and validates ancestor IDs", () => {
  assert.match(source, /function stableIdIsUnique\(element, documentRef, probe = unique\)/);
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /const part = nthPart\(current, includeId\)/);
});
