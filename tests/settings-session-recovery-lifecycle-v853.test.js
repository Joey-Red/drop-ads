import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M853 session recovery busy and single-flight state is lifecycle owned", () => {
  assert.match(source, /let busyDepth = 0/);
  assert.match(source, /busyDepth \+= 1/);
  assert.match(source, /busyDepth = Math\.max\(0, busyDepth - 1\)/);
  assert.match(source, /if \(!pageActive\) return;\s*if \(busyDepth === 0 && section\?\.isConnected\) section\.removeAttribute\("aria-busy"\)/);
  assert.match(source, /let recoveryMutationActive = false/);
  assert.match(source, /if \(!pageActive \|\| !status \|\| recoveryMutationActive\) return/);
  assert.match(source, /if \(!pageActive \|\| !status \|\| !resumeAll \|\| recoveryMutationActive\) return/);
  assert.match(source, /resumeAll\.disabled = recoveryMutationActive \|\| rows\.length === 0/);
  assert.match(source, /button\.disabled = recoveryMutationActive/);
  assert.match(source, /window\.addEventListener\("pagehide", \(\) => \{/);
  assert.match(source, /renderGeneration \+= 1/);
  assert.match(source, /renderQueued = false/);
  assert.match(source, /busyDepth = 0/);
  assert.match(source, /recoveryMutationActive = false/);
});
