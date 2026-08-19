import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("observer-driven list filtering coalesces work and stops after teardown", () => {
  assert.match(source, /function scheduleListMutationWork\(controller\)/);
  assert.match(source, /if \(!pageActive \|\| controller\.mutationQueued\) return;/);
  assert.match(source, /queueMicrotask\(\(\) => runPendingListMutationWork\(controller\)\)/);
  assert.match(source, /catch \{\s*runPendingListMutationWork\(controller\);\s*\}/);
  assert.match(source, /controller\.mutationQueued = false;/);
  assert.match(source, /controller\.pendingPresentationChange = false;/);
  assert.match(source, /pageActive = false;/);
});
