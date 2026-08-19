import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M846 bounds all selector-generation uniqueness probes", () => {
  assert.match(source, /const MAX_UNIQUENESS_PROBES = 32/);
  assert.match(source, /let uniquenessProbeCount = 0/);
  assert.match(source, /uniquenessProbeCount \+= 1/);
  assert.match(source, /uniquenessProbeCount > MAX_UNIQUENESS_PROBES/);
  assert.match(source, /Picker selector uniqueness probe limit exceeded/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate/);
  assert.match(source, /stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /probe\(documentRef, selector, element\)/);
  assert.match(source, /function selectorUniquelyIdentifies\(selector, element, documentRef = document\)/);
  assert.match(source, /MAX_UNIQUENESS_PROBES\n  \}\)/);
});
