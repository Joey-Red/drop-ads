import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";

export const COMMUNITY_RULE_KEYS = Object.freeze(["kind", "value", "resourceTypes"]);
const COMMUNITY_RULE_KEY_SET = new Set(COMMUNITY_RULE_KEYS);

export function snapshotCommunityRuleInput(rule) {
  assertPlainExactObject(rule, "Community candidate rule", COMMUNITY_RULE_KEY_SET);
  const snapshot = Object.create(null);
  for (const key of COMMUNITY_RULE_KEYS) {
    const field = readPlainDataField(rule, key);
    if (!field.safe) throw new TypeError(`Community candidate rule.${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  if (!Object.hasOwn(snapshot, "kind") || !Object.hasOwn(snapshot, "value")) {
    throw new Error("Community candidate rule must include kind and value");
  }
  return Object.freeze(snapshot);
}
