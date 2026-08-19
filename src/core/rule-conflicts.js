import { snapshotDenseDataArray } from "./object-schema.js";
import { MAX_PERSONAL_NETWORK_RULE_ITEMS } from "./personal-rules.js";
import { parseRuleKey, ruleKey } from "./rules.js";

function canonicalRuleKey(rule) {
  const key = ruleKey(rule);
  parseRuleKey(key);
  return key;
}

function canonicalRuleKeys(rules, label) {
  const candidates = snapshotDenseDataArray(rules, label, MAX_PERSONAL_NETWORK_RULE_ITEMS);
  const keys = new Array(candidates.length);
  for (let index = 0; index < candidates.length; index += 1) {
    keys[index] = canonicalRuleKey(candidates[index]);
  }
  return keys;
}

export function personalRuleConflictKeys(personalBlock = [], personalAllow = []) {
  const blockKeys = canonicalRuleKeys(personalBlock, "Personal block conflict rules");
  const allowKeys = new Set(canonicalRuleKeys(personalAllow, "Personal allow conflict rules"));
  const conflicts = new Set();
  for (const key of blockKeys) if (allowKeys.has(key)) conflicts.add(key);
  return conflicts;
}

export function isPersonalBlockOverridden(rule, personalAllow = []) {
  const key = canonicalRuleKey(rule);
  const allowKeys = canonicalRuleKeys(personalAllow, "Personal allow override rules");
  for (const candidateKey of allowKeys) if (candidateKey === key) return true;
  return false;
}
