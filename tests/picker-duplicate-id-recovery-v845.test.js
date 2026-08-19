import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M845 duplicate ids cannot poison picker hierarchy anchors", () => {
  assert.match(source, /function stableIdIsUnique\(element, documentRef, probe = unique\)/);
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /const part = nthPart\(current, includeId\)/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate/);
  assert.match(source, /const MAX_DEPTH = 5/);
  assert.match(source, /const MAX_SIBLING_SCAN = 10_000/);
});
