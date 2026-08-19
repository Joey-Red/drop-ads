import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M852 session recovery live sync is session-scoped and teardown-owned", () => {
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /if \(!pageActive \|\| internalMutationDepth > 0\) return;/);
  assert.match(source, /if \(areaName !== "session" \|\| !hasSessionStateChange\(changes\)\) return;/);
  assert.match(source, /renderGeneration \+= 1;/);
  assert.match(source, /renderQueued = false;/);
  assert.match(source, /disposeStorageSync\?\.\(\)/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.doesNotMatch(source, /storage\.session\.(?:get|set)/);
});
