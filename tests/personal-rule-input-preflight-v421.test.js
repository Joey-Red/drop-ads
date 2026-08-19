import test from "node:test";
import assert from "node:assert/strict";
import { ruleFromUserInput } from "../src/core/personal-rules.js";
import { MAX_NETWORK_RULE_VALUE_CHARS } from "../src/core/rules.js";

test("M421 direct personal rule input rejects one-over raw text before normalization", () => {
  assert.throws(
    () => ruleFromUserInput("x".repeat(MAX_NETWORK_RULE_VALUE_CHARS + 1)),
    new RegExp(`exceeds ${MAX_NETWORK_RULE_VALUE_CHARS} characters`)
  );
});

test("M421 ordinary direct personal rule input semantics remain unchanged", () => {
  assert.deepEqual(ruleFromUserInput(" Example.COM "), { kind: "domain", value: "example.com" });
  assert.deepEqual(ruleFromUserInput("https://example.com/ad#fragment"), {
    kind: "url",
    value: "https://example.com/ad"
  });
  assert.throws(() => ruleFromUserInput("   "), /Enter a domain or HTTP\(S\) URL/);
});
