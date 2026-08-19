import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsBackup } from "../src/core/settings-backup.js";
import { DEFAULT_STATE } from "../src/core/storage.js";

test("backup export preserves explicit boolean values", () => {
  const state = structuredClone(DEFAULT_STATE);
  state.enabled = false;
  state.autoSubmitCommunity = true;
  const backup = createSettingsBackup(state);
  assert.equal(backup.settings.enabled, false);
  assert.equal(backup.settings.autoSubmitCommunity, true);
});

test("backup export rejects missing canonical settings fields", () => {
  const state = structuredClone(DEFAULT_STATE);
  delete state.enabled;
  assert.throws(() => createSettingsBackup(state), /missing required field enabled/);
});

test("backup export rejects type-confused booleans", () => {
  const state = structuredClone(DEFAULT_STATE);
  state.enabled = "false";
  assert.throws(() => createSettingsBackup(state), /state.enabled must be boolean/);

  const state2 = structuredClone(DEFAULT_STATE);
  state2.autoSubmitCommunity = 1;
  assert.throws(() => createSettingsBackup(state2), /state.autoSubmitCommunity must be boolean/);
});

test("scalar export rejection happens before later collection normalization", () => {
  const state = structuredClone(DEFAULT_STATE);
  state.enabled = "true";
  const personalBlock = [];
  let reads = 0;
  Object.defineProperty(personalBlock, "0", { enumerable: true, get() { reads += 1; return { kind: "domain", value: "example.com" }; } });
  personalBlock.length = 1;
  state.personalBlock = personalBlock;
  assert.throws(() => createSettingsBackup(state), /state.enabled must be boolean/);
  assert.equal(reads, 0);
});
