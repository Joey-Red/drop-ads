import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("Settings session resume uses background transactional policy convergence", () => {
  assert.match(source, /sendOptionsRuntimeMessage/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /domain,/);
  assert.match(source, /paused: false/);
  assert.match(source, /unwrapOptionsRuntimeResponse\(response, "Could not resume protection for this site"\)/);
  assert.doesNotMatch(source, /setSessionSitePaused\(api,/);
});
