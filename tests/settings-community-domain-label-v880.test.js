import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/community-ui.js", import.meta.url), "utf8");

test("eligible community actions expose only the canonical outbound domain", () => {
  assert.match(source, /const candidate = candidateForRow\(row\)/);
  assert.match(source, /action\.textContent = `Prepare \$\{candidate\.value\}`/);
  assert.match(source, /Prepare community submission for \$\{candidate\.value\}/);
  assert.match(source, /action\.dataset\.communityCandidate = candidate\.value/);
  assert.doesNotMatch(source, /action\.textContent = .*rule\.value/);
});
