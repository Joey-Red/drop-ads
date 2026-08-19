import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const operation = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");
const ui = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M856 reset transaction and UI outcome lifecycle fail closed", () => {
  assert.match(operation, /MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(operation, /Object\.getOwnPropertyDescriptor\(current, "importSettingsBackup"\)/);
  assert.match(operation, /Reflect\.apply\(descriptor\.value, core, args\)/);
  assert.doesNotMatch(operation, /storage\.session|saveSessionState|SESSION_STORAGE_KEY/);
  assert.match(ui, /function setResetBusy\(busy\)/);
  assert.match(ui, /resetPanel\?\.setAttribute\("aria-busy", "true"\)/);
  assert.match(ui, /let succeeded = false/);
  assert.match(ui, /if \(pageActive && resetButton\?\.isConnected && resetConfirmButton\?\.isConnected\)/);
  assert.match(ui, /\(succeeded \? resetButton : resetConfirmButton\)\.focus\(\)/);
  assert.match(ui, /window\.addEventListener\("pagehide", \(\) => \{/);
  assert.match(ui, /pageActive = false/);
});
