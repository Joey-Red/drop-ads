import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("temporary-session recovery surface is reused instead of duplicated", () => {
  assert.match(source, /function ensureSessionPauseNavLink\(\)/);
  assert.ok(source.includes('settingsNav?.querySelector(\'a[href="#session-pauses-settings"]\')'));
  assert.match(source, /function ensureSessionPauseSection\(\)/);
  assert.match(source, /document\.querySelector\("#session-pauses-settings"\)/);
  assert.match(source, /if \(existing\) return existing;/);
  assert.match(source, /function recoverySurfaceReady\(\)/);
  assert.match(source, /if \(recoverySurfaceReady\(\)\)/);
});
