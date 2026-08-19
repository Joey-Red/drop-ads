import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M854 owns overlap-safe busy and single-flight session recovery state", () => {
  assert.match(source, /let busyDepth = 0;/);
  assert.match(source, /function beginSessionBusy\(\)/);
  assert.match(source, /busyDepth \+= 1/);
  assert.match(source, /busyDepth = Math\.max\(0, busyDepth - 1\)/);
  assert.match(source, /let recoveryMutationActive = false;/);
  assert.match(source, /resumeAll\.disabled = recoveryMutationActive \|\| rows\.length === 0/);
  assert.match(source, /button\.disabled = recoveryMutationActive/);
  assert.match(source, /if \(!pageActive \|\| !status \|\| recoveryMutationActive\) return;/);
  assert.match(source, /if \(!pageActive \|\| !status \|\| !resumeAll \|\| recoveryMutationActive\) return;/);
  assert.match(source, /recoveryMutationActive = false;/);
});
