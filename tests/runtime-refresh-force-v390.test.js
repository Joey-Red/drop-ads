import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M390 validates direct refresh force before queued or network work", () => {
  assert.match(source, /function strictRefreshForce\(force = false\)/);
  assert.match(source, /typeof force !== "boolean"/);
  assert.match(source, /throw new TypeError\("List refresh force must be boolean"\)/);
  assert.match(source, /async function prepareListRefresh\(force = false\) \{\s*const forceRefresh = strictRefreshForce\(force\);/s);
  assert.match(source, /function queueListRefresh\(force = false\) \{\s*const forceRefresh = strictRefreshForce\(force\);\s*return queueListTask\(\(\) => refreshListsOnce\(forceRefresh\)\);/s);
  assert.match(source, /if \(!forceRefresh && !isRefreshDue\(existing, timestamp\)\) continue;/);
});

test("M390 message path remains strict-true while direct controller calls reject type confusion", () => {
  assert.match(source, /queueListRefresh\(fields\.force === true\)/);
  assert.match(source, /refreshListsOnce: \(force = false\) => queueListRefresh\(force\)/);
});
