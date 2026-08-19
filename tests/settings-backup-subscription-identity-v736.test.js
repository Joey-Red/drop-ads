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

test("import rejects duplicate built-in subscription ids", () => {
  const backup = mutableBackup();
  backup.settings.subscriptions.push({ ...backup.settings.subscriptions[0] });
  assert.throws(() => parseSettingsBackup(backup), /repeats built-in subscription id/);
});

test("import rejects duplicate canonical external sources", () => {
  const backup = mutableBackup();
  backup.settings.subscriptions.push(
    { title: "One", format: "hosts", sourceUrl: "https://lists.example.com/hosts.txt#one", enabled: true },
    { title: "Two", format: "hosts", sourceUrl: "https://lists.example.com/hosts.txt#two", enabled: false }
  );
  assert.throws(() => parseSettingsBackup(backup), /repeats an external subscription source/);
});

test("import rejects an external record that aliases a built-in source", () => {
  const backup = mutableBackup();
  const builtInSource = "https://raw.githubusercontent.com/Joey-Red/drop-ads/main/lists/default.txt";
  backup.settings.subscriptions.push({ title: "Alias", format: "drop-ads-v1", sourceUrl: builtInSource, enabled: true });
  assert.throws(() => parseSettingsBackup(backup), /duplicates a canonical built-in source/);
});
