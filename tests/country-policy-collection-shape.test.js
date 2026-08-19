import test from "node:test";
import assert from "node:assert/strict";
import {
  collectCountryRules,
  makeCountryRule,
  MAX_COUNTRY_RULE_CANDIDATES
} from "../src/core/country-policy.js";

test("country policy collection rejects accessor entries without invoking getters", () => {
  let getterCalls = 0;
  const rules = [];
  Object.defineProperty(rules, "0", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return makeCountryRule("us");
    }
  });
  rules.length = 1;
  assert.throws(() => collectCountryRules(rules), /enumerable data entries/);
  assert.equal(getterCalls, 0);
});

test("country policy collection rejects holes and extra properties", () => {
  assert.throws(() => collectCountryRules(new Array(1)), /enumerable data entries|dense array/);
  const extra = [makeCountryRule("us")];
  extra.history = true;
  assert.throws(() => collectCountryRules(extra), /dense array indices/);
});

test("country policy collection rejects one-over before candidate parsing", () => {
  const over = new Array(MAX_COUNTRY_RULE_CANDIDATES + 1);
  assert.throws(() => collectCountryRules(over), /at most 10000/);
});

test("country policy collection preserves grouping and all-resources precedence", () => {
  const grouped = collectCountryRules([
    makeCountryRule("de", "navigation"),
    makeCountryRule("US", "navigation"),
    makeCountryRule("us", "all")
  ]);
  assert.deepEqual(grouped.map(({ tld, mode }) => ({ tld, mode })), [
    { tld: "de", mode: "navigation" },
    { tld: "us", mode: "all" }
  ]);
  assert.equal(grouped[1].rules.length, 2);
});

test("non-array legacy country input remains empty", () => {
  assert.deepEqual(collectCountryRules(null), []);
  assert.deepEqual(collectCountryRules({}), []);
});
