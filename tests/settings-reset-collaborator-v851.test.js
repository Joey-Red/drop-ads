import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/core/settings-reset-operation.js", import.meta.url), "utf8");

test("M851 captures the configured-reset import transaction without invoking accessors", () => {
  assert.match(source, /const MAX_RESET_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, "importSettingsBackup"\)/);
  assert.match(source, /Object\.getPrototypeOf\(current\)/);
  assert.match(source, /if \(!\("value" in descriptor\) \|\| typeof descriptor\.value !== "function"\)/);
  assert.match(source, /Reflect\.apply\(descriptor\.value, core, args\)/);
  assert.doesNotMatch(source, /core\.importSettingsBackup/);
});
