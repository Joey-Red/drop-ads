import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const operation = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");
const state = fs.readFileSync(new URL("../src/core/settings-reset.js", import.meta.url), "utf8");

test("canonical M857 configured reset captures the import transaction without invoking accessors", () => {
  assert.match(operation, /const MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(operation, /Object\.getOwnPropertyDescriptor\(current, "importSettingsBackup"\)/);
  assert.match(operation, /Object\.getPrototypeOf\(current\)/);
  assert.match(operation, /if \(!\("value" in descriptor\) \|\| typeof descriptor\.value !== "function"\)/);
  assert.match(operation, /Reflect\.apply\(descriptor\.value, core, args\)/);
  assert.doesNotMatch(operation, /core\.importSettingsBackup\s*\(/);
});

test("configured reset still delegates through the canonical backup/import transaction and excludes session state", () => {
  assert.match(operation, /createSettingsBackup\(createConfiguredResetState\(\)\)/);
  assert.match(operation, /const importSettingsBackup = captureImportSettingsBackup\(core\)/);
  assert.match(operation, /await importSettingsBackup\(backupText\)/);
  assert.match(operation, /Object\.freeze\(\{ changed: true \}\)/);
  assert.match(state, /subscriptions: normalizeSubscriptions\(DEFAULT_STATE\.subscriptions\)/);
  assert.doesNotMatch(operation + state, /storage\.session|SESSION_STORAGE_KEY|saveSessionState|setSessionSitePaused/);
});
