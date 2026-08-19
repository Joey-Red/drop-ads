import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M856 temporary session recovery invalidates late work on pagehide", () => {
  assert.match(source, /async function renderSessionPauses\(\) \{\s*if \(!pageActive \|\| !recoverySurfaceReady\(\)\) return false;/s);
  assert.match(source, /if \(!pageActive \|\| generation !== renderGeneration\) return false;[\s\S]*list\.replaceChildren\(fragment\)/);
  assert.match(source, /window\.addEventListener\("pagehide", \(\) => \{[\s\S]*pageActive = false;[\s\S]*renderGeneration \+= 1;[\s\S]*renderQueued = false;[\s\S]*busyDepth = 0;[\s\S]*recoveryMutationActive = false;/);
  assert.match(source, /resumeAll\?\.removeAttribute\("aria-busy"\);/);
  assert.match(source, /section\?\.removeAttribute\("aria-busy"\);/);
  assert.match(source, /disposeStorageSync\?\.\(\)/);
  assert.match(source, /if \(!pageActive\) return;[\s\S]*const rendered = await renderSessionPauses\(\);/);
  assert.doesNotMatch(source, /localStorage|sendBeacon|XMLHttpRequest/);
});
