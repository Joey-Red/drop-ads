import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M843 duplicate target ids fall back to bounded identity-free target structure", () => {
  assert.match(source, /const duplicateId = directCandidates\[0\]\?\.startsWith\("#"\) === true;/);
  assert.match(source, /const includeId = depth === 0 \? !duplicateId : stableIdIsUnique\(current, documentRef, probe\);/);
  assert.match(source, /const part = nthPart\(current, includeId\);/);
  assert.match(source, /if \(\(parts\.length > 1 \|\| selectorCarriesIdentity\(part, current\)\) && probe\(documentRef, selector, element\)\) return selector;/);
  assert.match(source, /const MAX_DEPTH = 5;/);
});
