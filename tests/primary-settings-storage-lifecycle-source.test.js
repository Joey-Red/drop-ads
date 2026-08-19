import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8");

test("primary Settings owns storage live-sync and stops queued publication after pagehide", () => {
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /let pageActive = true/);
  assert.match(source, /let disposeStorageLiveSync = null/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /disposeStorageLiveSync\?\.\(\)/);
  assert.match(source, /if \(!pageActive \|\| renderQueued\) return/);
  assert.match(source, /if \(!pageActive\) return false/);
  assert.doesNotMatch(source, /installOptionsStorageListener\(api,/);
});
