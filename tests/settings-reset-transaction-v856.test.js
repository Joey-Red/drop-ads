import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const background = fs.readFileSync(new URL("../src/background.js", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../src/core/settings-reset-runtime.js", import.meta.url), "utf8");
const operation = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");

test("M856 routes configured reset through a strict transactional runtime partition", () => {
  assert.match(background, /createResetPartitionedApi/);
  assert.match(background, /installSettingsResetRuntime/);
  assert.match(runtime, /validateSettingsResetMessage\(message\)/);
  assert.match(runtime, /resetConfiguredSettings\(core\)/);
  assert.match(operation, /createSettingsBackup\(createConfiguredResetState\(\)\)/);
  assert.match(operation, /await importSettingsBackup\(backupText\);/);
  assert.doesNotMatch(operation, /SESSION_STORAGE_KEY|storage\.session|disabledSites.*session/);
});
