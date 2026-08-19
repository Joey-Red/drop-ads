import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("list mutation work is coalesced with bounded flags and teardown invalidation", () => {
  assert.match(source, /function scheduleListMutationWork\(controller\)/);
  assert.match(source, /if \(!pageActive \|\| controller\.mutationQueued\) return/);
  assert.match(source, /queueMicrotask\(\(\) => runPendingListMutationWork\(controller\)\)/);
  assert.match(source, /catch \{\s*runPendingListMutationWork\(controller\);\s*\}/s);
  assert.match(source, /pendingPresentationChange: false/);
  assert.match(source, /pendingControlReenabled: false/);
  assert.doesNotMatch(source, /pendingMutations\s*=\s*\[/);
  assert.match(source, /pageActive = false;[\s\S]*controller\.mutationQueued = false/);
});
