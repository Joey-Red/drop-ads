import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M840 session-pause recovery owns live sync and overlap-safe busy state", () => {
  assert.match(source, /let busyDepth = 0;/);
  assert.match(source, /function beginSessionBusy\(\)/);
  assert.match(source, /busyDepth \+= 1;/);
  assert.match(source, /busyDepth = Math\.max\(0, busyDepth - 1\)/);
  assert.match(source, /installOwnedOptionsStorageListener\(api,/);
  assert.match(source, /areaName !== "session"/);
  assert.match(source, /if \(!pageActive \|\| internalMutationDepth > 0\) return;/);
  assert.match(source, /renderQueued = false;/);
  assert.match(source, /renderGeneration \+= 1;/);
  assert.match(source, /disposeStorageSync\?\.\(\)/);
});
