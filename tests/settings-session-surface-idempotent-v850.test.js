import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M850 session recovery surface reuses existing navigation and section nodes", () => {
  assert.match(source, /function ensureSessionPauseNavLink\(\)/);
  assert.match(source, /querySelector\('a\[href="#session-pauses-settings"\]'\)/);
  assert.match(source, /if \(existing\) return existing;/);
  assert.match(source, /function ensureSessionPauseSection\(\)/);
  assert.match(source, /document\.querySelector\("#session-pauses-settings"\)/);
  assert.match(source, /const section = ensureSessionPauseSection\(\);/);
  assert.match(source, /This recovery state stays in browser session storage only/);
  assert.doesNotMatch(source, /localStorage|sendBeacon|XMLHttpRequest/);
});
