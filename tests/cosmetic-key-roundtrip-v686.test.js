import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_COSMETIC_RULE_KEY_CHARS,
  cosmeticRuleKey,
  normalizeCosmeticRule,
  parseCosmeticRuleKey
} from "../src/core/cosmetic-rules.js";

test("cosmetic rule keys round-trip canonical sorted domain state", () => {
  const rule = normalizeCosmeticRule({
    selector: ".ad",
    domains: ["z.example.com", "EXAMPLE.COM", "z.example.com"],
    excludedDomains: ["safe.example.com", "a.example.com", "safe.example.com"]
  });
  assert.deepEqual(rule.domains, ["example.com", "z.example.com"]);
  assert.deepEqual(rule.excludedDomains, ["a.example.com", "safe.example.com"]);
  const key = cosmeticRuleKey(rule);
  const parsed = parseCosmeticRuleKey(key);
  assert.equal(cosmeticRuleKey(parsed), key);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.domains), true);
});

test("non-canonical cosmetic keys are rejected", () => {
  const canonical = cosmeticRuleKey({ selector: ".ad", domains: ["a.example.com", "z.example.com"] });
  const nonCanonical = canonical.replace("a.example.com,z.example.com", "z.example.com,a.example.com");
  assert.throws(() => parseCosmeticRuleKey(nonCanonical), /not canonical/);
});

test("oversized cosmetic rule keys fail before unbounded parsing", () => {
  assert.throws(() => parseCosmeticRuleKey("x".repeat(MAX_COSMETIC_RULE_KEY_CHARS + 1)), /exceeds/);
});
