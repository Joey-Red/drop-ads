import { snapshotDenseDataArray } from "./object-schema.js";
import { MAX_NETWORK_RULE_VALUE_CHARS, normalizeDomain, normalizeRule, parseRuleKey, ruleKey } from "./rules.js";

export const MAX_PERSONAL_NETWORK_RULE_ITEMS = 10_000;
export const MAX_PERSONAL_DOMAIN_ITEMS = 5_000;
export const MAX_PERSONAL_RULE_INPUT_CHARS = MAX_NETWORK_RULE_VALUE_CHARS * 2;

const EMPTY_PERSONAL_COLLECTION = Object.freeze([]);

function compatibleCollectionSnapshot(value, label, maxItems) {
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { throw new TypeError(`${label} array kind is invalid`); }
  if (!isArray) return EMPTY_PERSONAL_COLLECTION;
  return snapshotDenseDataArray(value, label, maxItems);
}

function frozenNormalizedRule(candidate) {
  const rule = normalizeRule(candidate);
  const resourceTypes = rule.resourceTypes?.length ? Object.freeze([...rule.resourceTypes]) : undefined;
  return Object.freeze({
    kind: rule.kind,
    value: rule.value,
    ...(resourceTypes ? { resourceTypes } : {})
  });
}

function networkRuleSnapshot(rules) {
  const candidates = compatibleCollectionSnapshot(rules, "Personal network rules", MAX_PERSONAL_NETWORK_RULE_ITEMS);
  return Object.freeze(candidates.map(frozenNormalizedRule));
}

function domainSnapshot(values) {
  return compatibleCollectionSnapshot(values, "Personal domains", MAX_PERSONAL_DOMAIN_ITEMS);
}

export function ruleFromUserInput(value) {
  if (typeof value !== "string") throw new TypeError("Rule input must be a string");
  if (value.length > MAX_PERSONAL_RULE_INPUT_CHARS) {
    throw new Error(`Rule input exceeds ${MAX_PERSONAL_RULE_INPUT_CHARS} characters`);
  }
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a domain or HTTP(S) URL");
  return frozenNormalizedRule({
    kind: /^https?:\/\//i.test(trimmed) ? "url" : "domain",
    value: trimmed
  });
}

export function addUniqueRule(rules, candidate) {
  const current = networkRuleSnapshot(rules);
  const normalized = frozenNormalizedRule(candidate);
  const normalizedKey = ruleKey(normalized);
  const existing = new Set(current.map(ruleKey));
  if (existing.has(normalizedKey)) return current;
  if (current.length >= MAX_PERSONAL_NETWORK_RULE_ITEMS) {
    throw new Error(`Personal network rules have a maximum of ${MAX_PERSONAL_NETWORK_RULE_ITEMS} rules`);
  }
  return Object.freeze([...current, normalized]);
}

export function removeRule(rules, key) {
  const canonicalKey = ruleKey(parseRuleKey(key));
  const current = networkRuleSnapshot(rules);
  return Object.freeze(current.filter((rule) => ruleKey(rule) !== canonicalKey));
}

export function normalizeDomainSet(values) {
  const candidates = domainSnapshot(values);
  const normalized = new Set();
  for (const value of candidates) {
    try {
      normalized.add(normalizeDomain(value));
    } catch {
      // Invalid persisted values are ignored rather than breaking startup.
    }
  }
  return Object.freeze([...normalized].sort());
}

export function setDomainFlag(values, domain, present) {
  if (typeof present !== "boolean") throw new TypeError("Personal domain flag must be boolean");
  const normalized = normalizeDomain(domain);
  const next = new Set(normalizeDomainSet(values));
  if (present) {
    if (!next.has(normalized) && next.size >= MAX_PERSONAL_DOMAIN_ITEMS) {
      throw new Error(`Personal domains have a maximum of ${MAX_PERSONAL_DOMAIN_ITEMS} entries`);
    }
    next.add(normalized);
  } else {
    next.delete(normalized);
  }
  return Object.freeze([...next].sort());
}

export function normalizeDisabledSites(sites) {
  return normalizeDomainSet(sites);
}

export function setSiteDisabled(sites, domain, disabled) {
  return setDomainFlag(sites, domain, disabled);
}
