import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const operation = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");
const state = fs.readFileSync(new URL("../src/core/settings-reset.js", import.meta.url), "utf8");

test("M854 configured reset delegates to the canonical import transaction", () => {
  assert.match(operation, /createSettingsBackup\(createConfiguredResetState\(\)\)/);
  assert.match(operation, /const importSettingsBackup = captureImportSettingsBackup\(core\)/);
  assert.match(operation, /await importSettingsBackup\(backupText\)/);
  assert.match(operation, /Reflect\.apply\(descriptor\.value, core, args\)/);
  assert.match(operation, /Object\.freeze\(\{ changed: true \}\)/);
  assert.match(state, /subscriptions: normalizeSubscriptions\(DEFAULT_STATE\.subscriptions\)/);
  assert.doesNotMatch(operation + state, /storage\.session|SESSION_STORAGE_KEY|saveSessionState|setSessionSitePaused/);
});
