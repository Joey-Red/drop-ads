import test from "node:test";
import assert from "node:assert/strict";
import { MAX_SETTINGS_BACKUP_BYTES, createSettingsBackup, parseSettingsBackup } from "../src/core/settings-backup.js";
import { DEFAULT_STATE } from "../src/core/storage.js";

test("obviously oversized backup strings are rejected", () => {
  assert.throws(() => parseSettingsBackup("x".repeat(MAX_SETTINGS_BACKUP_BYTES + 1)), /too large/);
});

test("multibyte strings cannot bypass the UTF-8 byte ceiling", () => {
  const text = "é".repeat(Math.floor(MAX_SETTINGS_BACKUP_BYTES / 2) + 1);
  assert.ok(text.length <= MAX_SETTINGS_BACKUP_BYTES);
  assert.throws(() => parseSettingsBackup(text), /too large/);
});

test("exact character ceiling proceeds to normal JSON parsing", () => {
  const text = "x".repeat(MAX_SETTINGS_BACKUP_BYTES);
  assert.throws(() => parseSettingsBackup(text), SyntaxError);
});

test("non-string backup objects retain normal parsing behavior", () => {
  const backup = createSettingsBackup(structuredClone(DEFAULT_STATE));
  assert.equal(parseSettingsBackup(backup).enabled, true);
});
