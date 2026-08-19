import assert from "node:assert/strict";
import test from "node:test";

import { MAX_EXCLUDED_INITIATOR_DOMAINS, compileCookieRules, compileManagedRules } from "../src/core/rules.js";

test("compileCookieRules defaults missing cookieMode to off", () => {
  assert.deepEqual(compileCookieRules({}), []);
  assert.deepEqual(compileCookieRules({ unrelated: "ignored" }), []);
});

test("compileCookieRules rejects relevant accessors without invoking getters", () => {
  let reads = 0;
  const state = {};
  Object.defineProperty(state, "cookieMode", {
    enumerable: true,
    get() {
      reads += 1;
      return "all";
    }
  });

  assert.throws(() => compileCookieRules(state), /own enumerable data field/);
  assert.equal(reads, 0);
});

test("compileCookieRules rejects inherited relevant fields", () => {
  const state = Object.create({ cookieMode: "all" });
  assert.throws(() => compileCookieRules(state), /plain object|own enumerable data field/);
});

test("compileCookieRules applies dense 5000-entry boundaries before exception normalization", () => {
  const max = Array.from({ length: MAX_EXCLUDED_INITIATOR_DOMAINS }, (_, index) => `d${index}.example`);
  const rules = compileCookieRules({ cookieMode: "third-party", disabledSites: max, cookieAllowSites: [] });
  assert.equal(rules[0].condition.excludedInitiatorDomains.length, MAX_EXCLUDED_INITIATOR_DOMAINS);

  assert.throws(
    () => compileCookieRules({ cookieMode: "all", disabledSites: [...max, "overflow.example"], cookieAllowSites: [] }),
    /at most 5000/
  );

  const sparse = new Array(1);
  assert.throws(() => compileCookieRules({ cookieMode: "all", disabledSites: sparse }), /enumerable data entries/);
});

test("compileCookieRules rejects accessor-bearing exception arrays without getter execution", () => {
  let reads = 0;
  const disabledSites = ["a.example"];
  Object.defineProperty(disabledSites, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return "a.example";
    }
  });

  assert.throws(() => compileCookieRules({ cookieMode: "third-party", disabledSites }), /enumerable data entries/);
  assert.equal(reads, 0);
});

test("compileCookieRules preserves exception dedupe and full-state compatibility", () => {
  const [rule] = compileCookieRules({
    enabled: true,
    cookieMode: "all",
    disabledSites: ["B.Example", "a.example"],
    cookieAllowSites: ["b.example"],
    personalBlock: []
  });

  assert.deepEqual(rule.condition.excludedInitiatorDomains, ["a.example", "b.example"]);
  assert.deepEqual(rule.condition.excludedRequestDomains, ["a.example", "b.example"]);
  assert.ok(Array.isArray(rule.condition.resourceTypes));
});

test("compileManagedRules preserves the off default when cookieMode is omitted", () => {
  const compiled = compileManagedRules({
    communityBlock: [],
    communityAllow: [],
    personalBlock: [],
    personalAllow: [],
    disabledSites: [],
    cookieAllowSites: []
  });
  assert.deepEqual(compiled, []);
});

test("compileManagedRules forwards present cookie policy through the direct compiler", () => {
  const compiled = compileManagedRules({
    communityBlock: [],
    communityAllow: [],
    personalBlock: [],
    personalAllow: [],
    disabledSites: ["broken.example"],
    cookieAllowSites: ["accounts.example"],
    cookieMode: "third-party"
  });
  assert.equal(compiled.length, 2);
  const cookieRule = compiled.find((rule) => rule.action.type === "modifyHeaders");
  assert.ok(cookieRule);
  assert.deepEqual(cookieRule.condition.excludedInitiatorDomains, ["accounts.example", "broken.example"]);
});
