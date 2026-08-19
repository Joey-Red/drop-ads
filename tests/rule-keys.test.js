import test from "node:test";
import assert from "node:assert/strict";
import { removeRule } from "../src/core/personal-rules.js";
import {
  MAX_NETWORK_RULE_KEY_CHARS,
  MAX_NETWORK_RULE_VALUE_CHARS,
  normalizeRule,
  parseRuleKey,
  ruleKey
} from "../src/core/rules.js";

const SEP = "\u0000";

test("serialized rule keys round-trip only through canonical rules", () => {
  const rule = normalizeRule({
    kind: "url",
    value: "https://cdn.example/ad.js#fragment",
    resourceTypes: ["script", "image"]
  });
  const key = ruleKey(rule);
  assert.deepEqual(parseRuleKey(key), rule);
  assert.equal(ruleKey(parseRuleKey(key)), key);
});

test("max-size canonical pattern remains removable", () => {
  const rule = { kind: "pattern", value: "a".repeat(MAX_NETWORK_RULE_VALUE_CHARS) };
  const key = ruleKey(rule);
  assert.ok(key.length <= MAX_NETWORK_RULE_KEY_CHARS);
  assert.deepEqual(parseRuleKey(key), rule);
  assert.deepEqual(removeRule([rule], key), []);
});

test("one-over values and keys beyond the derived bound are rejected", () => {
  const oneOverValue = `pattern${SEP}${"a".repeat(MAX_NETWORK_RULE_VALUE_CHARS + 1)}${SEP}`;
  assert.throws(() => parseRuleKey(oneOverValue), /exceeds 16384 characters/);
  assert.throws(
    () => parseRuleKey(`pattern${SEP}${"a".repeat(MAX_NETWORK_RULE_KEY_CHARS)}${SEP}`),
    new RegExp(`Rule key exceeds ${MAX_NETWORK_RULE_KEY_CHARS} characters`)
  );
});

test("noncanonical and malformed serialized keys fail closed", () => {
  assert.throws(() => parseRuleKey(`domain${SEP}ADS.EXAMPLE.COM${SEP}`), /not canonical/);
  assert.throws(() => parseRuleKey(`url${SEP}https:\/\/example.com\/#x${SEP}`), /not canonical/);
  assert.throws(() => parseRuleKey(`pattern${SEP}ads${SEP}script,image`), /not canonical/);
  assert.throws(() => parseRuleKey(`pattern${SEP}ads${SEP}script,script`), /not canonical/);
  assert.throws(() => parseRuleKey(`pattern${SEP}ads${SEP}script,`), /empty resource type/);
  assert.throws(() => parseRuleKey(`pattern${SEP}ads${SEP}bogus`), /Unsupported resource type/);
  assert.throws(() => parseRuleKey(`bogus${SEP}ads${SEP}`), /Unsupported rule kind in key/);
  assert.throws(() => parseRuleKey(`pattern${SEP}a${SEP}${SEP}`), /exactly two separators/);
  assert.throws(() => parseRuleKey("pattern-only"), /exactly two separators/);
});

test("rule values cannot inject the key separator", () => {
  assert.throws(() => ruleKey({ kind: "pattern", value: `ad${SEP}tracker` }), /NUL character/);
});

test("malformed removal keys fail before the input collection is changed", () => {
  const rules = [{ kind: "domain", value: "ads.example.com" }];
  const snapshot = structuredClone(rules);
  assert.throws(() => removeRule(rules, `domain${SEP}ADS.EXAMPLE.COM${SEP}`), /not canonical/);
  assert.deepEqual(rules, snapshot);
});
