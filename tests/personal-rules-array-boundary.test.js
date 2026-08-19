import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_PERSONAL_DOMAIN_ITEMS,
  MAX_PERSONAL_NETWORK_RULE_ITEMS,
  addUniqueRule,
  normalizeDomainSet,
  removeRule
} from "../src/core/personal-rules.js";
import { ruleKey } from "../src/core/rules.js";

const rule = (value) => ({ kind: "domain", value });

test("personal rule helpers reject accessor-bearing arrays without invoking getters", () => {
  let reads = 0;
  const rules = [rule("one.example")];
  Object.defineProperty(rules, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return rule("one.example");
    }
  });

  assert.throws(() => addUniqueRule(rules, rule("two.example")), /enumerable data entries/);
  assert.equal(reads, 0);
  assert.throws(() => removeRule(rules, ruleKey(rule("one.example"))), /enumerable data entries/);
  assert.equal(reads, 0);
});

test("personal rule helpers reject sparse and extra-property arrays", () => {
  const sparse = new Array(1);
  assert.throws(() => addUniqueRule(sparse, rule("two.example")), /enumerable data entries/);

  const extra = [rule("one.example")];
  extra.note = "unexpected";
  assert.throws(() => removeRule(extra, ruleKey(rule("one.example"))), /dense array indices/);
});

test("personal rule collection work is bounded and additions cannot exceed the persisted ceiling", () => {
  const max = Array.from({ length: MAX_PERSONAL_NETWORK_RULE_ITEMS }, (_, index) => rule(`r${index}.example`));
  assert.equal(addUniqueRule(max, rule("r0.example")).length, MAX_PERSONAL_NETWORK_RULE_ITEMS);
  assert.throws(() => addUniqueRule(max, rule("overflow.example")), /maximum of 10000 rules/);

  const over = [...max, rule("overflow.example")];
  assert.throws(() => removeRule(over, ruleKey(rule("r0.example"))), /at most 10000/);
});

test("domain-set normalization uses the 5000-entry dense snapshot boundary", () => {
  const valid = ["B.Example", "a.example", "b.example"];
  assert.deepEqual(normalizeDomainSet(valid), ["a.example", "b.example"]);

  const max = Array.from({ length: MAX_PERSONAL_DOMAIN_ITEMS }, (_, index) => `d${index}.example`);
  assert.equal(normalizeDomainSet(max).length, MAX_PERSONAL_DOMAIN_ITEMS);
  assert.throws(() => normalizeDomainSet([...max, "overflow.example"]), /at most 5000/);

  let reads = 0;
  const accessor = ["a.example"];
  Object.defineProperty(accessor, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return "a.example";
    }
  });
  assert.throws(() => normalizeDomainSet(accessor), /enumerable data entries/);
  assert.equal(reads, 0);
});

test("legacy non-array personal collections retain empty fallback behavior", () => {
  assert.deepEqual(normalizeDomainSet(null), []);
  assert.deepEqual(removeRule(null, ruleKey(rule("a.example"))), []);
  assert.deepEqual(addUniqueRule(null, rule("a.example")), [rule("a.example")]);
});
