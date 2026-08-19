import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");

test("M856 bounds configured-reset serialization before transactional activation", () => {
  assert.match(source, /createSettingsBackup, MAX_SETTINGS_BACKUP_BYTES/);
  assert.match(source, /function serializeConfiguredResetBackup\(backup\)/);
  assert.match(source, /new TextEncoder\(\)\.encode\(text\)\.byteLength/);
  assert.match(source, /bytes > MAX_SETTINGS_BACKUP_BYTES/);
  assert.match(source, /throw new RangeError\("Configured settings reset exceeds the supported backup size"\)/);
  assert.match(source, /const backupText = serializeConfiguredResetBackup\(backup\)/);
  assert.match(source, /await importSettingsBackup\(backupText\)/);
  assert.doesNotMatch(source, /storage\.session|SESSION_STORAGE_KEY|saveSessionState/);
});
