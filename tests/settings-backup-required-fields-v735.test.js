import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsBackup, parseSettingsBackup } from "../src/core/settings-backup.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function state() {
  return currentStateFixture({ updateIntervalHours: 24 });
}

test("v1 import requires every non-legacy-optional settings field", () => {
  const required = ["enabled", "autoSubmitCommunity", "updateIntervalHours", "cookieMode", "cookieAllowSites", "personalBlock", "personalAllow", "disabledSites", "subscriptions"];
  for (const key of required) {
    const backup = JSON.parse(JSON.stringify(createSettingsBackup(state())));
    delete backup.settings[key];
    assert.throws(() => parseSettingsBackup(backup), new RegExp(`missing required field ${key}`));
  }
});

test("legacy v1 backups may still omit cosmetic arrays", () => {
  const backup = JSON.parse(JSON.stringify(createSettingsBackup(state())));
  delete backup.settings.personalCosmeticHide;
  delete backup.settings.personalCosmeticAllow;
  const restored = parseSettingsBackup(backup);
  assert.deepEqual(restored.personalCosmeticHide, []);
  assert.deepEqual(restored.personalCosmeticAllow, []);
});
