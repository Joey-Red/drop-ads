import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_COUNTRY_TLD_INPUT_CHARS,
  makeCountryRule,
  normalizeCountryTld
} from "../src/core/country-policy.js";

test("country TLD input is bounded before URL parsing", () => {
  const oversized = "a".repeat(MAX_COUNTRY_TLD_INPUT_CHARS + 1);
  assert.throws(() => normalizeCountryTld(oversized), /at most 256 characters/);
});

test("normal country TLD normalization remains canonical", () => {
  assert.equal(normalizeCountryTld(".US"), "us");
  assert.equal(normalizeCountryTld(" uk "), "uk");
  assert.deepEqual(makeCountryRule("US", "navigation"), {
    kind: "pattern",
    value: "||us^",
    resourceTypes: ["main_frame"]
  });
});

test("IDN country TLD input still canonicalizes through URL punycode", () => {
  const normalized = normalizeCountryTld("中国");
  assert.match(normalized, /^xn--[a-z0-9-]+$/);
  assert.equal(normalizeCountryTld(normalized), normalized);
});
