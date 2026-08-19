import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsBackup, parseSettingsBackup } from "../src/core/settings-backup.js";
import { currentStateFixture } from "./helpers/current-state-fixture.js";

function state() {
  return currentStateFixture({
    updateIntervalHours: 24,
    cookieAllowSites: ["accounts.example.com"],
    personalBlock: [{ kind: "domain", value: "ads.example.com" }],
    personalAllow: [{ kind: "domain", value: "needed.example.com" }],
    personalCosmeticHide: [{ selector: ".sponsor", domains: ["example.com"] }],
    personalCosmeticAllow: [{ selector: ".needed", domains: ["example.com"] }],
    disabledSites: ["broken.example.com"]
  });
}

test("parsed settings import state is deeply immutable", () => {
  const parsed = parseSettingsBackup(JSON.stringify(createSettingsBackup(state())));
  assert.equal(Object.isFrozen(parsed), true);
  for (const key of ["cookieBannerDisabledSites", "cookieAllowSites", "personalBlock", "personalAllow", "personalCosmeticHide", "personalCosmeticAllow", "disabledSites", "subscriptions"]) {
    assert.equal(Object.isFrozen(parsed[key]), true, key);
  }
  assert.equal(Object.isFrozen(parsed.personalBlock[0]), true);
  assert.equal(Object.isFrozen(parsed.personalCosmeticHide[0]), true);
  assert.equal(Object.isFrozen(parsed.personalCosmeticHide[0].domains), true);
  assert.throws(() => { parsed.personalBlock.push({ kind: "domain", value: "mutated.example" }); }, TypeError);
  assert.throws(() => { parsed.enabled = false; }, TypeError);
});
