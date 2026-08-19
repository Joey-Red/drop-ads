import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("popup render queues fail closed after pagehide", () => {
  assert.match(source, /function queueCommittedRender\(\) \{\n  if \(!pageActive \|\| renderQueued\) return;/);
  assert.match(source, /function runCommittedRender\(\) \{\n  renderQueued = false;\n  if \(!pageActive\) return;/);
  assert.match(source, /async function renderCommittedState[\s\S]*if \(!pageActive \|\| generation !== committedRenderGeneration\) return false;/);
  assert.match(source, /installPopupStorageListener\(api, \(changes, areaName\) => \{\n      if \(!pageActive\) return;/);
  assert.match(source, /pageActive = false;\n  renderQueued = false;/);
});
