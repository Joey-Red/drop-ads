import assert from "node:assert/strict";
import test from "node:test";

import { countryRuleLabel, makeCountryRule, parseCountryRule } from "../src/core/country-policy.js";

test("country label rejects parsed-looking accessors without invoking them", () => {
  let reads = 0;
  const candidate = { mode: "all" };
  Object.defineProperty(candidate, "tld", {
    enumerable: true,
    get() {
      reads += 1;
      return "us";
    }
  });
  assert.equal(countryRuleLabel(candidate), null);
  assert.equal(reads, 0);
});

test("country label rejects inherited and custom-prototype parsed-looking values", () => {
  assert.equal(countryRuleLabel(Object.create({ tld: "us", mode: "all" })), null);
  assert.equal(countryRuleLabel(Object.assign(Object.create({ custom: true }), { tld: "us", mode: "all" })), null);
});

test("country label accepts canonical parsed output", () => {
  const parsed = parseCountryRule(makeCountryRule("uk", "navigation"));
  assert.equal(countryRuleLabel(parsed), "Country TLD · .uk · Navigation only");
});

test("country label still accepts raw canonical country rules", () => {
  assert.equal(countryRuleLabel(makeCountryRule("us", "all")), "Country TLD · .us · All resources");
});
