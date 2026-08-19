import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/action-count.js", import.meta.url), "utf8");

test("action-count Settings owns storage live-sync and stops publishing after pagehide", () => {
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /let disposeStorageLiveSync = null/);
  assert.match(source, /let pageActive = true/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /committedRefreshGeneration \+= 1/);
  assert.match(source, /disposeStorageLiveSync\?\.\(\)/);
  assert.match(source, /if \(!pageActive \|\| generation !== committedRefreshGeneration \|\| internalMutationDepth !== 0\) return false/);
  assert.doesNotMatch(source, /installOptionsStorageListener\(api,/);
});
