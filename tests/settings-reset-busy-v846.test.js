import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M853 configured reset owns a single-flight busy state across confirmation controls", () => {
  assert.match(source, /let resetBusy = false/);
  assert.match(source, /function setResetBusy\(busy\)/);
  assert.match(source, /resetButton\.disabled = busy/);
  assert.match(source, /resetConfirmButton\.disabled = busy/);
  assert.match(source, /resetCancelButton\.disabled = busy/);
  assert.match(source, /resetConfirmButton\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /resetPanel\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(source, /if \(!pageActive \|\| resetBusy \|\| !resetConfirmButton \|\| resetConfirmButton\.disabled\) return/);
  assert.match(source, /event\.key !== "Escape" \|\| resetBusy/);
  assert.match(source, /if \(pageActive && resetButton\?\.isConnected && resetConfirmButton\?\.isConnected\)/);
});

test("M854 reset confirmation retains session-separation, privacy, and transaction descriptions", () => {
  assert.match(source, /confirmation\.setAttribute\("aria-labelledby", "reset-settings-confirmation-text"\)/);
  assert.match(source, /confirmation\.setAttribute\("aria-describedby", "reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error"\)/);
  assert.match(source, /confirmButton\.setAttribute\("aria-describedby", "reset-settings-confirmation-text reset-settings-session-note reset-settings-privacy reset-settings-status reset-settings-error"\)/);
  assert.match(source, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /error\.setAttribute\("role", "alert"\)/);
});
