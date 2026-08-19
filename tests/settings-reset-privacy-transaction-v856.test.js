import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const operation = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");
const ui = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");

test("M856 configured reset reuses the transactional import path without history or session mutation", () => {
  assert.match(operation, /const importSettingsBackup = captureImportSettingsBackup\(core\);/);
  assert.match(operation, /const backup = createSettingsBackup\(createConfiguredResetState\(\)\);/);
  assert.match(operation, /await importSettingsBackup\(backupText\);/);
  assert.match(operation, /return Object\.freeze\(\{ changed: true \}\);/);
  assert.match(ui, /This is a local recovery action\. Drop Ads does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry\./);
  assert.doesNotMatch(operation, /fetch\(|sendBeacon|XMLHttpRequest|saveSessionState|storage\.session/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest/);
});
