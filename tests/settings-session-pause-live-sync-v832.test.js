import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M832 live-syncs only the canonical session pause state and owns teardown", () => {
  assert.match(source, /SESSION_STORAGE_KEY/);
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /areaName !== "session"/);
  assert.match(source, /hasSessionStateChange\(changes\)/);
  assert.match(source, /internalMutationDepth > 0/);
  assert.match(source, /renderQueued/);
  assert.match(source, /queueMicrotask\(runQueuedRender\)/);
  assert.match(source, /disposeStorageSync\?\.\(\)/);
  assert.doesNotMatch(source, /changeHistory|storageHistory|Date\.|performance\.|telemetry|analytics/);
});
