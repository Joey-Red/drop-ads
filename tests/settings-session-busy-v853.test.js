import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M853 keeps session recovery busy ownership depth-counted and teardown-safe", () => {
  assert.match(source, /let busyDepth = 0;/);
  assert.match(source, /function beginSessionBusy\(\)/);
  assert.match(source, /busyDepth \+= 1;/);
  assert.match(source, /busyDepth = Math\.max\(0, busyDepth - 1\);/);
  assert.match(source, /if \(busyDepth === 0 && section\?\.isConnected\) section\.removeAttribute\("aria-busy"\);/);
  assert.match(source, /busyDepth = 0;[\s\S]*section\?\.removeAttribute\("aria-busy"\);/);
});
