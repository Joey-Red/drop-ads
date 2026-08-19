import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M836 selector generation has an explicit uniqueness-probe budget", () => {
  assert.match(source, /const MAX_UNIQUENESS_PROBES = 32;/);
  assert.match(source, /let uniquenessProbeCount = 0;/);
  assert.match(source, /uniquenessProbeCount \+= 1;/);
  assert.match(source, /uniquenessProbeCount > MAX_UNIQUENESS_PROBES/);
  assert.match(source, /Picker selector uniqueness probe limit exceeded/);
  assert.match(source, /stableIdIsUnique\(current, documentRef, probe\)/);
  assert.match(source, /probe\(documentRef, selector, element\)/);
  assert.match(source, /MAX_UNIQUENESS_PROBES\n  \}\);/);
});
