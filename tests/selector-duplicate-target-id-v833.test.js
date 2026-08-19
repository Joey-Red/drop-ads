import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M833 duplicate target ids fall back without terminating bounded selector construction", () => {
  assert.match(source, /function directIdentityCandidates\(element, includeId = true\)/);
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /const part = nthPart\(current, includeId\)/);
  assert.match(source, /current = parentElementOf\(current\)/);
  assert.doesNotMatch(source, /if \(part\.startsWith\("#"\)\) break/);
});
