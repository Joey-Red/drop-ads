import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");

test("configured reset delegates to the existing serialized transactional import path", () => {
  assert.match(source, /createSettingsBackup\(createConfiguredResetState\(\)\)/);
  assert.match(source, /await importSettingsBackup\(backupText\)/);
  assert.doesNotMatch(source, /saveSessionState|storage\.session|SESSION_STORAGE_KEY/);
  assert.doesNotMatch(source, /updateDynamicRules|saveStateAndListCache/);
  assert.match(source, /Object\.freeze\(\{/);
});

test("configured reset captures the import transaction without invoking accessors", () => {
  assert.match(source, /MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, "importSettingsBackup"\)/);
  assert.match(source, /Object\.getPrototypeOf\(current\)/);
  assert.match(source, /Reflect\.apply\(descriptor\.value, core, args\)/);
  assert.doesNotMatch(source, /typeof core\.importSettingsBackup/);
  assert.doesNotMatch(source, /core\.importSettingsBackup\(backupText\)/);
});
