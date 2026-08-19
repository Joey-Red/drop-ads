import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");
const audit = fs.readFileSync(new URL("../tools/session-recovery-hardening-audit.mjs", import.meta.url), "utf8");

test("M849 session recovery uses the captured exact runtime-message boundary", () => {
  assert.match(source, /sendOptionsRuntimeMessage\(api, \{[\s\S]*type: "drop-ads:set-session-site-paused"[\s\S]*domain,[\s\S]*paused: false[\s\S]*\}\)/);
  assert.match(source, /unwrapOptionsRuntimeResponse\(response, "Could not resume protection for this site"\)/);
  assert.doesNotMatch(source, /saveSessionState\s*\(/);
  assert.match(audit, /canonical runtime boundary verified through M849/);
  assert.match(audit, /settings-session-recovery-runtime-v849\.test\.js/);
});
