import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsBackup, parseSettingsBackup, SETTINGS_BACKUP_FORMAT, SETTINGS_BACKUP_VERSION } from "../src/core/settings-backup.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function state() {
  return currentStateFixture();
}

function backup(settings = state()) {
  return { format: SETTINGS_BACKUP_FORMAT, version: SETTINGS_BACKUP_VERSION, settings };
}

test("createSettingsBackup avoids normal state Proxy get traps", () => {
  const source = new Proxy(state(), { get() { throw new Error("normal get trap must not run"); } });
  const result = createSettingsBackup(source);
  assert.equal(result.format, SETTINGS_BACKUP_FORMAT);
  assert.equal(result.settings.enabled, true);
});

test("createSettingsBackup never executes state getters", () => {
  const source = state();
  let reads = 0;
  Object.defineProperty(source, "cookieMode", { enumerable: true, get() { reads += 1; return "third-party"; } });
  assert.throws(() => createSettingsBackup(source));
  assert.equal(reads, 0);
});

test("parseSettingsBackup avoids normal root Proxy get traps", () => {
  const source = new Proxy(backup(), { get() { throw new Error("normal get trap must not run"); } });
  assert.equal(parseSettingsBackup(source).enabled, true);
});

test("parseSettingsBackup never executes nested settings getters", () => {
  const settings = state();
  let reads = 0;
  Object.defineProperty(settings, "enabled", { enumerable: true, get() { reads += 1; return true; } });
  assert.throws(() => parseSettingsBackup(backup(settings)));
  assert.equal(reads, 0);
});

test("parseSettingsBackup retains older v1 cosmetic omission compatibility", () => {
  const settings = state();
  delete settings.personalCosmeticHide;
  delete settings.personalCosmeticAllow;
  const parsed = parseSettingsBackup(backup(settings));
  assert.deepEqual(parsed.personalCosmeticHide, []);
  assert.deepEqual(parsed.personalCosmeticAllow, []);
});

test("settings backup root descriptor trap failures are contained", () => {
  const source = new Proxy(backup(), {
    getOwnPropertyDescriptor(target, key) {
      if (key === "settings") throw new Error("descriptor trap");
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.throws(() => parseSettingsBackup(source), /settings|inspectable|field/i);
});
