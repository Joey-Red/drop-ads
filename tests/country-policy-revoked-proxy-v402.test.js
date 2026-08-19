import test from "node:test";
import assert from "node:assert/strict";

import {
  collectCountryRules,
  countryRuleLabel,
  makeCountryRule
} from "../src/core/country-policy.js";

function revokedProxy(target) {
  const { proxy, revoke } = Proxy.revocable(target, {});
  revoke();
  return proxy;
}

test("M402 country collection preserves ordinary non-array compatibility and dense behavior", () => {
  assert.deepEqual(collectCountryRules(null), []);
  assert.deepEqual(collectCountryRules({}), []);
  assert.equal(collectCountryRules([makeCountryRule("us")])[0].tld, "us");
});

test("M402 revoked collection proxies fail deterministically", () => {
  assert.throws(() => collectCountryRules(revokedProxy([])), /Country policy rules array kind is invalid/);
});

test("M402 revoked parsed-label candidates fail closed without escaping", () => {
  assert.equal(countryRuleLabel(revokedProxy({ tld: "us", mode: "navigation" })), null);
});
