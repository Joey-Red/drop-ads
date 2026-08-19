import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PERSONAL_RULE_INPUT_CHARS,
  ruleFromUserInput
} from "../src/core/personal-rules.js";
import { MAX_NETWORK_RULE_VALUE_CHARS } from "../src/core/rules.js";

test("M426 raw personal rule input has an explicit pre-trim work ceiling", () => {
  assert.equal(MAX_PERSONAL_RULE_INPUT_CHARS, MAX_NETWORK_RULE_VALUE_CHARS * 2);
  assert.throws(
    () => ruleFromUserInput(" ".repeat(MAX_PERSONAL_RULE_INPUT_CHARS + 1)),
    new RegExp(`Rule input exceeds ${MAX_PERSONAL_RULE_INPUT_CHARS} characters`)
  );
});

test("M426 ordinary surrounding whitespace remains compatible inside the raw ceiling", () => {
  const rule = ruleFromUserInput("   example.com   ");
  assert.deepEqual(rule, { kind: "domain", value: "example.com" });
});

test("M426 canonical network-value ceiling remains authoritative after trimming", () => {
  const oversizedCanonical = "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS + 1);
  assert.ok(oversizedCanonical.length <= MAX_PERSONAL_RULE_INPUT_CHARS);
  assert.throws(() => ruleFromUserInput(oversizedCanonical));
});
