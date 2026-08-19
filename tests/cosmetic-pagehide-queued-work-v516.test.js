import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/cosmetics.js", import.meta.url), "utf8");

test("Cosmetic Settings invalidates queued renders on pagehide", () => {
  assert.match(source, /let pageActive = true/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /pageActive = false;\s*renderGeneration \+= 1;\s*renderQueued = false;/s);
  assert.match(source, /if \(!pageActive \|\| generation !== renderGeneration\) return false/);
  assert.match(source, /function runQueuedRender\(\) \{\s*renderQueued = false;\s*if \(!pageActive\) return;/s);
  assert.match(source, /function queueRender\(\) \{\s*if \(!pageActive \|\| renderQueued\) return;/s);
});
