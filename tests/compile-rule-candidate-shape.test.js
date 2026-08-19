import test from "node:test";
import assert from "node:assert/strict";
import { compileRules, MAX_COMPILE_RULE_CANDIDATES } from "../src/core/rules.js";

const RULE = { kind: "domain", value: "ads.example.com" };

test("compileRules rejects accessor rule entries without invoking getters", () => {
  let getterCalls = 0;
  const rules = [];
  Object.defineProperty(rules, "0", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return RULE;
    }
  });
  rules.length = 1;

  assert.throws(() => compileRules(rules, "personalBlock"), /enumerable data entries/);
  assert.equal(getterCalls, 0);
});

test("compileRules rejects holey and extra-property rule arrays", () => {
  assert.throws(() => compileRules(new Array(1), "personalBlock"), /enumerable data entries|dense array/);

  const extra = [RULE];
  extra.history = true;
  assert.throws(() => compileRules(extra, "personalBlock"), /dense array indices/);
});

test("compileRules rejects over-one-million candidates before item work", () => {
  const over = new Array(MAX_COMPILE_RULE_CANDIDATES + 1);
  assert.throws(() => compileRules(over, "personalBlock"), /at most 1000000/);
});

test("compileRules preserves canonical dedupe and batching for valid arrays", () => {
  const compiled = compileRules([
    RULE,
    { kind: "domain", value: "ADS.EXAMPLE.COM" },
    { kind: "url", value: "https://cdn.example.com/ad.js#fragment" }
  ], "personalBlock");

  assert.equal(compiled.length, 2);
  assert.deepEqual(compiled[0].condition.requestDomains, ["ads.example.com"]);
  assert.equal(compiled[1].condition.urlFilter, "|https://cdn.example.com/ad.js|");
});
