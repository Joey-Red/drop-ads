import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/core/settings-reset.js", import.meta.url), "utf8");

test("configured reset state is rebuilt from defaults without retained activity data", () => {
  assert.match(source, /export function createConfiguredResetState\(\)/);
  assert.match(source, /Object\.freeze\(\{/);
  assert.match(source, /subscriptions: normalizeSubscriptions\(DEFAULT_STATE\.subscriptions\)/);
  for (const field of ["cookieAllowSites", "personalBlock", "personalAllow", "personalCosmeticHide", "personalCosmeticAllow", "disabledSites"]) {
    assert.match(source, new RegExp(`${field}: EMPTY_RESET_COLLECTION`));
  }
  assert.doesNotMatch(source, /structuredClone|session|history|telemetry|analytics|statistics|identifier/i);
});
