import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsBackup, parseSettingsBackup } from "../src/core/settings-backup.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function state() {
  return currentStateFixture({ updateIntervalHours: 24 });
}

function mutableBackup() {
  return JSON.parse(JSON.stringify(createSettingsBackup(state())));
}

test("import rejects duplicate canonical personal network rules", () => {
  const backup = mutableBackup();
  backup.settings.personalBlock = [
    { kind: "domain", value: "Ads.Example.com" },
    { kind: "domain", value: "ads.example.com" }
  ];
  assert.throws(() => parseSettingsBackup(backup), /duplicate canonical rule/);
});

test("import rejects duplicate canonical cosmetic rules", () => {
  const backup = mutableBackup();
  backup.settings.personalCosmeticHide = [
    { selector: ".sponsor", domains: ["example.com"] },
    { selector: ".sponsor", domains: ["example.com"] }
  ];
  assert.throws(() => parseSettingsBackup(backup), /duplicate canonical cosmetic rule/);
});

test("import rejects duplicate canonical domains", () => {
  const backup = mutableBackup();
  backup.settings.disabledSites = ["Broken.Example.com", "broken.example.com"];
  assert.throws(() => parseSettingsBackup(backup), /duplicate canonical domain/);
});
