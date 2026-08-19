import test from "node:test";
import assert from "node:assert/strict";

import { parseSettingsBackup } from "../src/core/settings-backup.js";

function backupWithSubscriptions(subscriptions) {
  return {
    format: "drop-ads-settings",
    version: 1,
    settings: {
      enabled: true,
      autoSubmitCommunity: false,
      updateIntervalHours: 24,
      cookieMode: "third-party",
      cookieAllowSites: [],
      personalBlock: [],
      personalAllow: [],
      personalCosmeticHide: [],
      personalCosmeticAllow: [],
      disabledSites: [],
      subscriptions
    }
  };
}

function byId(state, id) {
  return state.subscriptions.find((subscription) => subscription.id === id);
}

test("M452 omitted built-in enabled preserves each canonical default", () => {
  const state = parseSettingsBackup(backupWithSubscriptions([
    { id: "drop-ads-default" },
    { id: "stevenblack-hosts" }
  ]));

  assert.equal(byId(state, "drop-ads-default").enabled, true);
  assert.equal(byId(state, "stevenblack-hosts").enabled, false);
});

test("M452 explicit built-in enabled values still override canonical defaults", () => {
  const state = parseSettingsBackup(backupWithSubscriptions([
    { id: "drop-ads-default", enabled: false },
    { id: "stevenblack-hosts", enabled: true }
  ]));

  assert.equal(byId(state, "drop-ads-default").enabled, false);
  assert.equal(byId(state, "stevenblack-hosts").enabled, true);
});
