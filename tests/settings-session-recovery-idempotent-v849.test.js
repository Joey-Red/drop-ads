import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("session recovery surface reuses existing nav and section", () => {
  assert.match(source, /function ensureSessionPauseNavLink\(\)/);
  assert.match(source, /querySelector\('a\[href="#session-pauses-settings"\]'\)/);
  assert.match(source, /if \(existing\) return existing;/);
  assert.match(source, /function ensureSessionPauseSection\(\)/);
  assert.match(source, /querySelector\("#session-pauses-settings"\)/);
  assert.match(source, /ensureSessionPauseNavLink\(\);/);
  assert.match(source, /const section = ensureSessionPauseSection\(\);/);
});
