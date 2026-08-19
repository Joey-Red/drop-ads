import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M836 bounds selector uniqueness probes per generation", () => {
  assert.match(source, /const MAX_UNIQUENESS_PROBES = 32;/);
  assert.match(source, /let uniquenessProbeCount = 0;/);
  assert.match(source, /uniquenessProbeCount \+= 1;/);
  assert.match(source, /if \(uniquenessProbeCount > MAX_UNIQUENESS_PROBES\) throw new Error\("Picker selector uniqueness probe limit exceeded"\);/);
  assert.match(source, /for \(const candidate of directCandidates\) if \(probe\(documentRef, candidate, element\)\) return candidate;/);
  assert.match(source, /stableIdIsUnique\(current, documentRef, probe\)/);
});
