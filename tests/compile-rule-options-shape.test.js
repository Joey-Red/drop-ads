import test from "node:test";
import assert from "node:assert/strict";
import { compileRules, MAX_EXCLUDED_INITIATOR_DOMAINS } from "../src/core/rules.js";

const RULE = { kind: "domain", value: "ads.example.com" };

test("compileRules rejects accessor options without executing getters", () => {
  let getterCalls = 0;
  const options = {};
  Object.defineProperty(options, "excludedInitiatorDomains", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return [];
    }
  });

  assert.throws(() => compileRules([RULE], "personalBlock", options), /data field/);
  assert.equal(getterCalls, 0);
});

test("compileRules rejects unknown and custom-prototype option fields", () => {
  assert.throws(
    () => compileRules([RULE], "personalBlock", { excludedInitiatorDomains: [], history: [] }),
    /unsupported field/
  );
  const options = Object.create({ inherited: true });
  options.excludedInitiatorDomains = [];
  assert.throws(() => compileRules([RULE], "personalBlock", options), /plain object/);
});

test("compileRules validates exclusion arrays even for allow tiers", () => {
  const holey = new Array(1);
  assert.throws(
    () => compileRules([RULE], "personalAllow", { excludedInitiatorDomains: holey }),
    /enumerable data entries|dense array/
  );
});

test("compileRules rejects accessor exclusion entries without executing getters", () => {
  let getterCalls = 0;
  const exclusions = [];
  Object.defineProperty(exclusions, "0", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "example.com";
    }
  });
  exclusions.length = 1;

  assert.throws(
    () => compileRules([RULE], "personalBlock", { excludedInitiatorDomains: exclusions }),
    /enumerable data entries/
  );
  assert.equal(getterCalls, 0);
});

test("compileRules preserves normalized block exclusions", () => {
  const compiled = compileRules([RULE], "personalBlock", {
    excludedInitiatorDomains: ["EXAMPLE.COM", "example.com", "invalid"]
  });
  assert.deepEqual(compiled[0].condition.excludedInitiatorDomains, ["example.com"]);
});

test("compileRules enforces the 5000-entry raw exclusion ceiling", () => {
  const exact = Array(MAX_EXCLUDED_INITIATOR_DOMAINS).fill("example.com");
  assert.doesNotThrow(() => compileRules([], "personalBlock", { excludedInitiatorDomains: exact }));
  assert.throws(
    () => compileRules([], "personalBlock", { excludedInitiatorDomains: [...exact, "example.org"] }),
    /at most 5000/
  );
});
