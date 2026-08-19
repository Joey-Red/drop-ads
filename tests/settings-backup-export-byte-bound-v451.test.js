import test from "node:test";
import assert from "node:assert/strict";

import {
  createSettingsBackup,
  MAX_SETTINGS_BACKUP_BYTES
} from "../src/core/settings-backup.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function state(overrides = {}) {
  return currentStateFixture(overrides);
}

test("M451 exported settings backup fits the same byte ceiling accepted by import", () => {
  const backup = createSettingsBackup(state());
  const serialized = JSON.stringify(backup);
  assert.ok(serialized.length <= MAX_SETTINGS_BACKUP_BYTES);
  assert.ok(new TextEncoder().encode(serialized).byteLength <= MAX_SETTINGS_BACKUP_BYTES);
});

test("M451 oversized canonical export fails instead of producing an unimportable backup", () => {
  const selectors = Array.from({ length: 3_000 }, (_, index) => ({
    selector: `#${"a".repeat(390)}${index}`
  }));
  assert.throws(
    () => createSettingsBackup(state({ personalCosmeticHide: selectors })),
    /Settings backup is too large/
  );
});
