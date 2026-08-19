import test from "node:test";
import assert from "node:assert/strict";
import { compileManagedRules } from "../src/core/rules.js";

function state() {
  return {
    enabled: true,
    autoSubmitCommunity: false,
    updateIntervalHours: 12,
    cookieMode: "third-party",
    cookieAllowSites: [],
    disabledSites: [],
    communityBlock: [],
    communityAllow: [],
    personalBlock: [],
    personalAllow: [],
    subscriptions: []
  };
}

test("compileManagedRules rejects relevant state accessors without executing getters", () => {
  let getterCalls = 0;
  const input = state();
  Object.defineProperty(input, "personalBlock", {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls += 1;
      return [];
    }
  });

  assert.throws(() => compileManagedRules(input), /own enumerable data field/);
  assert.equal(getterCalls, 0);
});

test("compileManagedRules ignores unrelated canonical accessors instead of reading them", () => {
  let getterCalls = 0;
  const input = state();
  Object.defineProperty(input, "subscriptions", {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls += 1;
      return [];
    }
  });

  assert.doesNotThrow(() => compileManagedRules(input));
  assert.equal(getterCalls, 0);
});

test("managed policy domain arrays reject accessors and over-limit input", () => {
  let getterCalls = 0;
  const input = state();
  const domains = [];
  Object.defineProperty(domains, "0", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "example.com";
    }
  });
  domains.length = 1;
  input.disabledSites = domains;

  assert.throws(() => compileManagedRules(input), /enumerable data entries/);
  assert.equal(getterCalls, 0);

  input.disabledSites = new Array(5_001);
  assert.throws(() => compileManagedRules(input), /at most 5000/);
});

test("managed policy personalAllow is snapshotted before recovery rules are appended", () => {
  let getterCalls = 0;
  const input = state();
  const rules = [];
  Object.defineProperty(rules, "0", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return { kind: "domain", value: "ads.example.com" };
    }
  });
  rules.length = 1;
  input.personalAllow = rules;

  assert.throws(() => compileManagedRules(input), /enumerable data entries/);
  assert.equal(getterCalls, 0);
});

test("full canonical state retains cookie and site recovery semantics", () => {
  const input = state();
  input.disabledSites = ["Example.COM"];
  input.cookieAllowSites = ["cookies.example.org"];
  input.personalBlock = [{ kind: "domain", value: "ads.example.net" }];

  const rules = compileManagedRules(input);
  const cookie = rules.find((rule) => rule.id === 3_000_000);
  assert.ok(cookie);
  assert.deepEqual(cookie.condition.excludedInitiatorDomains, ["cookies.example.org", "example.com"]);
  assert.ok(rules.some((rule) => rule.priority === 400 && rule.condition.requestDomains?.includes("example.com")));
});
