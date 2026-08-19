import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M851 routes temporary-session recovery through reviewed runtime actions and live sync", () => {
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /paused: false/);
  assert.match(source, /unwrapOptionsRuntimeResponse\(response, "Could not resume protection for this site"\)/);
  assert.match(source, /async function resumeAllSessionPauses\(\)/);
  assert.match(source, /if \(areaName !== "session" \|\| !hasSessionStateChange\(changes\)\) return/);
  assert.match(source, /if \(!pageActive \|\| internalMutationDepth > 0\) return/);
  assert.match(source, /disposeStorageSync\?\.\(\)/);
  assert.doesNotMatch(source, /storage\.session\.(?:get|set)|saveSessionState\s*\(/);
});
