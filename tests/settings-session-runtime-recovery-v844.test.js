import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sourceUrl = new URL("../src/options/session-pauses.js", import.meta.url);
const duplicateUrl = new URL("../src/options/session-recovery.js", import.meta.url);
const source = fs.readFileSync(sourceUrl, "utf8");

test("M844 Settings session recovery uses the background transaction only", () => {
  assert.match(source, /sendOptionsRuntimeMessage\(api, \{/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /paused: false/);
  assert.doesNotMatch(source, /storage\.session\.set|saveSessionState/);
  assert.equal(fs.existsSync(duplicateUrl), false);
});
