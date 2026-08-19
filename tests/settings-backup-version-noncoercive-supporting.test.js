import test from "node:test";
import assert from "node:assert/strict";

import { parseSettingsBackup, SETTINGS_BACKUP_FORMAT } from "../src/core/settings-backup.js";

function minimalSettings() {
  return {
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
    subscriptions: []
  };
}

test("settings backup version rejection does not coerce hostile objects", () => {
  let conversions = 0;
  const version = {
    toString() { conversions += 1; throw new Error("must not run"); },
    valueOf() { conversions += 1; throw new Error("must not run"); },
    [Symbol.toPrimitive]() { conversions += 1; throw new Error("must not run"); }
  };

  assert.throws(
    () => parseSettingsBackup({ format: SETTINGS_BACKUP_FORMAT, version, settings: minimalSettings() }),
    /Unsupported settings backup version/
  );
  assert.equal(conversions, 0);
});

test("settings backup version requires the exact safe-integer schema version", () => {
  for (const version of [undefined, null, true, false, "1", 1.0 + Number.EPSILON, 2, NaN, Infinity]) {
    assert.throws(
      () => parseSettingsBackup({ format: SETTINGS_BACKUP_FORMAT, version, settings: minimalSettings() }),
      /Unsupported settings backup version/
    );
  }
});
