import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEFAULT_STATE, normalizePersistedState } from "../src/core/storage.js";

test("default state collections are immutable shared constants", () => {
  assert.equal(Object.isFrozen(DEFAULT_STATE), true);
  for (const key of [
    "cookieAllowSites",
    "personalBlock",
    "personalAllow",
    "personalCosmeticHide",
    "personalCosmeticAllow",
    "disabledSites",
    "subscriptions"
  ]) assert.equal(Object.isFrozen(DEFAULT_STATE[key]), true, `${key} should be frozen`);
});

test("default-state construction does not depend on ambient structuredClone", () => {
  const source = fs.readFileSync(new URL("../src/core/storage.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /structuredClone\s*\(/);

  const normalized = normalizePersistedState({});
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.cookieMode, "third-party");
  assert.deepEqual(normalized.personalBlock, []);
  assert.ok(normalized.subscriptions.length > 0);
  assert.notEqual(normalized.personalBlock, DEFAULT_STATE.personalBlock);
});
