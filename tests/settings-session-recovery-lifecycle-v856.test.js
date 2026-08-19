import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M856 session recovery teardown invalidates stale async UI work", () => {
  assert.match(source, /if \(!pageActive \|\| renderQueued \|\| !recoverySurfaceReady\(\)\) return/);
  assert.match(source, /if \(!pageActive \|\| generation !== renderGeneration\) return false/);
  assert.match(source, /function handleResumeAllClick\(\)/);
  assert.match(source, /resumeAll\.addEventListener\("click", handleResumeAllClick\)/);
  assert.match(source, /resumeAll\?\.removeEventListener\("click", handleResumeAllClick\)/);
  assert.match(source, /window\.addEventListener\("pagehide", \(\) => \{/);
  assert.match(source, /pageActive = false/);
  assert.match(source, /renderGeneration \+= 1/);
  assert.match(source, /renderQueued = false/);
  assert.match(source, /busyDepth = 0/);
  assert.match(source, /recoveryMutationActive = false/);
  assert.match(source, /section\?\.removeAttribute\("aria-busy"\)/);
  assert.match(source, /disposeStorageSync\?\.\(\)/);
  assert.match(source, /disposeStorageSync = null/);
});
