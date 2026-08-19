import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_PERSONAL_RULE_INPUT_CHARS,
  ruleFromUserInput
} from "../src/core/personal-rules.js";
import { MAX_NETWORK_RULE_VALUE_CHARS } from "../src/core/rules.js";

test("M425 raw personal rule input is bounded before trim work", () => {
  assert.equal(MAX_PERSONAL_RULE_INPUT_CHARS, MAX_NETWORK_RULE_VALUE_CHARS * 2);
  const oversized = " ".repeat(MAX_PERSONAL_RULE_INPUT_CHARS + 1);
  assert.throws(() => ruleFromUserInput(oversized), new RegExp(`exceeds ${MAX_PERSONAL_RULE_INPUT_CHARS} characters`));
});

test("M425 normal surrounding whitespace remains compatible", () => {
  assert.deepEqual(ruleFromUserInput("  example.com  "), { kind: "domain", value: "example.com" });
});

test("M425 canonical rule limit remains authoritative after raw preflight", () => {
  const prefix = "https://example.com/";
  const exact = prefix + "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS - prefix.length);
  const normalized = ruleFromUserInput(` ${exact} `);
  assert.equal(normalized.kind, "url");
  assert.equal(normalized.value.length, MAX_NETWORK_RULE_VALUE_CHARS);
});
