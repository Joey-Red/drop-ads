import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");
const operation = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");

test("M853 configured reset explicitly preserves temporary session recovery state", () => {
  assert.match(ui, /Temporary session pauses are separate ephemeral recovery state and are not cleared by this action/);
  assert.match(ui, /Temporary session pauses will remain until the browser session ends/);
  assert.match(ui, /Configured settings restored to defaults\. Temporary session pauses were left unchanged/);
  assert.match(operation, /createSettingsBackup\(createConfiguredResetState\(\)\)/);
  assert.match(operation, /await importSettingsBackup\(backupText\)/);
  assert.doesNotMatch(operation, /saveSessionState|SESSION_STORAGE_KEY|storage\.session/);
});
