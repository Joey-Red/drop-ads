import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PERSONAL_RULE_INPUT_CHARS,
  ruleFromUserInput
} from "../src/core/personal-rules.js";
import { MAX_NETWORK_RULE_VALUE_CHARS } from "../src/core/rules.js";

test("M431 raw personal rule input has an explicit pre-trim ceiling", () => {
  assert.equal(MAX_PERSONAL_RULE_INPUT_CHARS, MAX_NETWORK_RULE_VALUE_CHARS * 2);
  assert.throws(
    () => ruleFromUserInput(" ".repeat(MAX_PERSONAL_RULE_INPUT_CHARS + 1)),
    new RegExp(`exceeds ${MAX_PERSONAL_RULE_INPUT_CHARS} characters`)
  );
});

test("M431 surrounding whitespace remains compatible within the raw ceiling", () => {
  const rule = ruleFromUserInput("   example.com   ");
  assert.equal(rule.kind, "domain");
  assert.equal(rule.value, "example.com");
});

test("M431 canonical rule-value limit remains authoritative after trimming", () => {
  const overCanonical = "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS + 1);
  assert.ok(overCanonical.length <= MAX_PERSONAL_RULE_INPUT_CHARS);
  assert.throws(() => ruleFromUserInput(overCanonical));
});
