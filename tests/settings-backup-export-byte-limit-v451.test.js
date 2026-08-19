import test from "node:test";
import assert from "node:assert/strict";

import {
  createSettingsBackup,
  MAX_SETTINGS_BACKUP_BYTES
} from "../src/core/settings-backup.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function stateWith(personalBlock = []) {
  return currentStateFixture({ updateIntervalHours: 24, personalBlock });
}

test("M451 exported settings backup fits the same UTF-8 ceiling as import", () => {
  const backup = createSettingsBackup(stateWith());
  const serialized = JSON.stringify(backup);
  assert.ok(serialized.length <= MAX_SETTINGS_BACKUP_BYTES);
  assert.ok(new TextEncoder().encode(serialized).byteLength <= MAX_SETTINGS_BACKUP_BYTES);
});

test("M451 refuses to return a canonical backup that cannot be re-imported by size", () => {
  const longRules = Array.from({ length: 80 }, (_, index) => ({
    kind: "url",
    value: `https://example.com/${index}/${"a".repeat(14_000)}`
  }));

  assert.throws(
    () => createSettingsBackup(stateWith(longRules)),
    /Settings backup is too large/
  );
});
