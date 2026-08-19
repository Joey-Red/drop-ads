import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("M811 queued and in-flight popup renders fail closed after teardown or supersession", () => {
  assert.match(source, /let renderQueued = false;/);
  assert.match(source, /let committedRenderGeneration = 0;/);
  assert.match(source, /pageActive = false;\n  renderQueued = false;\n  committedRenderGeneration \+= 1;/);
  assert.match(source, /function queueCommittedRender\(\) \{\n  if \(!pageActive \|\| renderQueued\) return;/);
  assert.match(source, /function runCommittedRender\(\) \{\n  renderQueued = false;\n  if \(!pageActive\) return;/);
  assert.match(source, /const generation = \+\+committedRenderGeneration;/);
  assert.match(source, /if \(!pageActive \|\| generation !== committedRenderGeneration\) return false;/);
  assert.match(source, /if \(pageActive && published\) clearGlobalStatus\(revision\)/);
});
