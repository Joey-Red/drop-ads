import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup render queue rejects stale or post-teardown work", () => {
  assert.match(source, /function queueCommittedRender\(\) \{\n  if \(!pageActive \|\| renderQueued\) return;/);
  assert.match(source, /function runCommittedRender\(\) \{\n  renderQueued = false;\n  if \(!pageActive\) return;/);
  assert.match(source, /const generation = \+\+committedRenderGeneration;/);
  assert.match(source, /if \(!pageActive \|\| generation !== committedRenderGeneration\) return false;/);
});
