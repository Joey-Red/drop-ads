import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const RULE_TIERS = Object.freeze({
  communityBlock: Object.freeze({ idStart: 1_000_000, idEnd: 1_499_999, priority: 100, action: "block" }),
  communityAllow: Object.freeze({ idStart: 1_500_000, idEnd: 1_999_999, priority: 200, action: "allow" }),
  personalBlock: Object.freeze({ idStart: 2_000_000, idEnd: 2_499_999, priority: 300, action: "block" }),
  personalAllow: Object.freeze({ idStart: 2_500_000, idEnd: 2_999_999, priority: 400, action: "allow" })
});

export const DOMAIN_BATCH_SIZE = 200;
export const PERSONAL_POLICY_RULE_RESERVE = 256;
export const MAX_NETWORK_RULE_VALUE_CHARS = 16_384;
export const MAX_NETWORK_RULE_RESOURCE_TYPES = 16;
export const MAX_CANONICAL_DOMAIN_CHARS = 253;
export const MAX_EXCLUDED_INITIATOR_DOMAINS = 5_000;
export const MAX_COMPILE_RULE_CANDIDATES = 1_000_000;
export const COOKIE_RULE_ID = 3_000_000;
export const COOKIE_RULE_PRIORITY = 50;
export const MANAGED_RULE_ID_MIN = RULE_TIERS.communityBlock.idStart;
export const MANAGED_RULE_ID_MAX = COOKIE_RULE_ID;

const NETWORK_RULE_KEYS = new Set(["kind", "value", "resourceTypes"]);
const NETWORK_RULE_KINDS = new Set(["domain", "url", "pattern"]);
const COMPILE_RULE_OPTION_KEYS = new Set(["excludedInitiatorDomains"]);
const COMPILE_MANAGED_OPTION_KEYS = new Set(["maxDynamicRules"]);
const COOKIE_POLICY_STATE_KEYS = Object.freeze(["cookieMode", "disabledSites", "cookieAllowSites"]);
const MANAGED_POLICY_STATE_KEYS = Object.freeze([
  "cookieMode",
  "disabledSites",
  "cookieAllowSites",
  "communityBlock",
  "communityAllow",
  "personalBlock",
  "personalAllow"
]);
const RULE_KEY_SEPARATOR = "\u0000";
const VALID_RESOURCE_TYPES = new Set([
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "media",
  "websocket",
  "other"
]);
const ALL_RESOURCE_TYPES = [...VALID_RESOURCE_TYPES];
const MAX_CANONICAL_RESOURCE_TYPE_KEY_CHARS = [...VALID_RESOURCE_TYPES].sort().join(",").length;
const MAX_NETWORK_RULE_KIND_CHARS = Math.max(...[...NETWORK_RULE_KINDS].map((kind) => kind.length));
export const MAX_NETWORK_RULE_KEY_CHARS = MAX_NETWORK_RULE_VALUE_CHARS
  + MAX_NETWORK_RULE_KIND_CHARS
  + 2
  + MAX_CANONICAL_RESOURCE_TYPE_KEY_CHARS;

function boundedRuleInput(value, label) {
  if (typeof value !== "string") throw new TypeError(`${label} must be a string`);
  const candidate = value.trim();
  if (candidate.length > MAX_NETWORK_RULE_VALUE_CHARS) {
    throw new Error(`${label} exceeds ${MAX_NETWORK_RULE_VALUE_CHARS} characters`);
  }
  if (candidate.includes(RULE_KEY_SEPARATOR)) throw new Error(`${label} cannot contain a NUL character`);
  return candidate;
}

export function normalizeDomain(value) {
  let candidate = boundedRuleInput(value, "Domain").toLowerCase();
  if (!candidate) throw new Error("Domain cannot be empty");

  candidate = candidate.replace(/^\|\|/, "").replace(/\^$/, "");
  candidate = candidate.replace(/^\*\./, "").replace(/\.$/, "");

  if (/^https?:\/\//i.test(candidate)) {
    candidate = new URL(candidate).hostname;
  } else {
    if (/[/?#@]/.test(candidate)) throw new Error("Domain rules cannot contain a path, query, fragment, or credentials");
    candidate = new URL(`http://${candidate}`).hostname;
  }

  if (!candidate || candidate.length > MAX_CANONICAL_DOMAIN_CHARS) throw new Error("Invalid domain");
  if (candidate !== "localhost" && !candidate.includes(".") && !/^\d+\.\d+\.\d+\.\d+$/.test(candidate)) {
    throw new Error("Domain must be canonical");
  }
  return candidate;
}

export function normalizeHttpUrl(value) {
  const candidate = boundedRuleInput(value, "URL");
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only HTTP(S) URLs can be filtered");
  if (url.username || url.password) throw new Error("Filtered URLs cannot contain credentials");
  url.hash = "";
  if (url.href.length > MAX_NETWORK_RULE_VALUE_CHARS) {
    throw new Error(`Canonical URL exceeds ${MAX_NETWORK_RULE_VALUE_CHARS} characters`);
  }
  return url.href;
}

export function normalizePattern(value) {
  const pattern = boundedRuleInput(value, "Pattern");
  if (!pattern) throw new Error("Pattern cannot be empty");
  if (/[^\x00-\x7F]/.test(pattern)) throw new Error("Patterns must be ASCII; encode non-ASCII URL characters first");
  return pattern;
}

function normalizeResourceTypes(resourceTypes) {
  if (resourceTypes == null) return undefined;
  const candidates = snapshotDenseDataArray(resourceTypes, "resourceTypes", MAX_NETWORK_RULE_RESOURCE_TYPES);
  if (candidates.length === 0) throw new Error("resourceTypes must be a non-empty array");
  const normalized = [...new Set(candidates)];
  for (const type of normalized) {
    if (!VALID_RESOURCE_TYPES.has(type)) throw new Error(`Unsupported resource type: ${type}`);
  }
  return normalized.sort();
}

export function normalizeRule(rule) {
  assertPlainExactObject(rule, "Rule", NETWORK_RULE_KEYS);
  const kindField = readPlainDataField(rule, "kind");
  const valueField = readPlainDataField(rule, "value");
  const resourceTypesField = readPlainDataField(rule, "resourceTypes");
  if (!kindField.safe || !kindField.present) throw new Error("Rule.kind must be an own enumerable data field");
  if (!valueField.safe || !valueField.present) throw new Error("Rule.value must be an own enumerable data field");
  if (!resourceTypesField.safe) throw new Error("Rule.resourceTypes must be an own enumerable data field when present");

  const kind = kindField.value;
  const value = valueField.value;
  const resourceTypes = resourceTypesField.present ? normalizeResourceTypes(resourceTypesField.value) : undefined;
  let normalizedValue;
  if (kind === "domain") normalizedValue = normalizeDomain(value);
  else if (kind === "url") normalizedValue = normalizeHttpUrl(value);
  else if (kind === "pattern") normalizedValue = normalizePattern(value);
  else throw new Error(`Unsupported rule kind: ${kind}`);

  return {
    kind,
    value: normalizedValue,
    ...(resourceTypes ? { resourceTypes } : {})
  };
}

export function ruleKey(rule) {
  const normalized = normalizeRule(rule);
  const key = `${normalized.kind}${RULE_KEY_SEPARATOR}${normalized.value}${RULE_KEY_SEPARATOR}${(normalized.resourceTypes ?? []).join(",")}`;
  if (key.length > MAX_NETWORK_RULE_KEY_CHARS) throw new Error("Canonical rule key exceeds its derived size limit");
  return key;
}

export function parseRuleKey(key) {
  if (typeof key !== "string") throw new TypeError("Rule key must be a string");
  if (!key) throw new Error("Rule key cannot be empty");
  if (key.length > MAX_NETWORK_RULE_KEY_CHARS) {
    throw new Error(`Rule key exceeds ${MAX_NETWORK_RULE_KEY_CHARS} characters`);
  }

  const parts = key.split(RULE_KEY_SEPARATOR);
  if (parts.length !== 3) throw new Error("Rule key must contain exactly two separators");
  const [kind, value, resourceTypeText] = parts;
  if (!NETWORK_RULE_KINDS.has(kind)) throw new Error(`Unsupported rule kind in key: ${kind}`);

  let resourceTypes;
  if (resourceTypeText) {
    resourceTypes = resourceTypeText.split(",");
    if (resourceTypes.some((type) => !type)) throw new Error("Rule key contains an empty resource type");
  }

  const normalized = normalizeRule({
    kind,
    value,
    ...(resourceTypes ? { resourceTypes } : {})
  });
  if (ruleKey(normalized) !== key) throw new Error("Rule key is not canonical");
  return normalized;
}

function normalizeDomainList(values) {
  if (!Array.isArray(values)) return [];
  const normalized = new Set();
  for (const value of values) {
    try {
      normalized.add(normalizeDomain(value));
    } catch {
      // Invalid persisted exclusion values must not poison the active ruleset.
    }
  }
  return [...normalized].sort();
}

function snapshotRelevantPolicyState(state, label, relevantKeys) {
  let isArray;
  let prototype;
  try {
    isArray = Array.isArray(state);
    prototype = state && typeof state === "object" ? Object.getPrototypeOf(state) : null;
  } catch {
    throw new TypeError(`${label} is invalid`);
  }
  if (!state || typeof state !== "object" || isArray || (prototype !== Object.prototype && prototype !== null)) {
    throw new TypeError(`${label} must be a plain object`);
  }

  const snapshot = Object.create(null);
  for (const key of relevantKeys) {
    const field = readPlainDataField(state, key);
    if (!field.safe) throw new Error(`${label}.${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  return snapshot;
}

function snapshotManagedPolicyState(state) {
  return snapshotRelevantPolicyState(state, "Managed policy state", MANAGED_POLICY_STATE_KEYS);
}

function makeConditionForRule(rule, excludedInitiatorDomains) {
  const condition = {};
  if (rule.kind === "url") condition.urlFilter = `|${rule.value}|`;
  if (rule.kind === "pattern") condition.urlFilter = rule.value;
  if (rule.resourceTypes) condition.resourceTypes = rule.resourceTypes;
  if (excludedInitiatorDomains.length) condition.excludedInitiatorDomains = excludedInitiatorDomains;
  return condition;
}

function compileDomainConditions(domainRules, excludedInitiatorDomains) {
  const groups = new Map();
  for (const rule of domainRules) {
    const key = (rule.resourceTypes ?? []).join(",");
    if (!groups.has(key)) groups.set(key, { resourceTypes: rule.resourceTypes, domains: [] });
    groups.get(key).domains.push(rule.value);
  }

  const conditions = [];
  for (const key of [...groups.keys()].sort()) {
    const group = groups.get(key);
    const domains = [...new Set(group.domains)].sort();
    for (let index = 0; index < domains.length; index += DOMAIN_BATCH_SIZE) {
      const condition = { requestDomains: domains.slice(index, index + DOMAIN_BATCH_SIZE) };
      if (group.resourceTypes) condition.resourceTypes = group.resourceTypes;
      if (excludedInitiatorDomains.length) condition.excludedInitiatorDomains = excludedInitiatorDomains;
      conditions.push(condition);
    }
  }
  return conditions;
}

export function compileRules(rules, tierName, options = {}) {
  const tier = RULE_TIERS[tierName];
  if (!tier) throw new Error(`Unknown rule tier: ${tierName}`);
  const ruleCandidates = snapshotDenseDataArray(rules, "compileRules rules", MAX_COMPILE_RULE_CANDIDATES);
  assertPlainExactObject(options, "compileRules options", COMPILE_RULE_OPTION_KEYS);
  const exclusionField = readPlainDataField(options, "excludedInitiatorDomains");
  if (!exclusionField.safe) throw new Error("compileRules options.excludedInitiatorDomains must be an own enumerable data field when present");

  let exclusionCandidates = [];
  if (exclusionField.present) {
    exclusionCandidates = snapshotDenseDataArray(
      exclusionField.value,
      "compileRules excludedInitiatorDomains",
      MAX_EXCLUDED_INITIATOR_DOMAINS
    );
  }
  const excludedInitiatorDomains = tier.action === "block"
    ? normalizeDomainList(exclusionCandidates)
    : [];
  const deduped = new Map();
  for (const candidate of ruleCandidates) {
    const normalized = normalizeRule(candidate);
    deduped.set(ruleKey(normalized), normalized);
  }

  const normalizedRules = [...deduped.values()];
  const domainRules = normalizedRules.filter((rule) => rule.kind === "domain");
  const independentRules = normalizedRules
    .filter((rule) => rule.kind !== "domain")
    .sort((a, b) => ruleKey(a).localeCompare(ruleKey(b)));

  const conditions = [
    ...compileDomainConditions(domainRules, excludedInitiatorDomains),
    ...independentRules.map((rule) => makeConditionForRule(rule, excludedInitiatorDomains))
  ];

  const capacity = tier.idEnd - tier.idStart + 1;
  if (conditions.length > capacity) throw new Error(`${tierName} exceeds its compiled rule capacity of ${capacity}`);

  return conditions.map((condition, index) => ({
    id: tier.idStart + index,
    priority: tier.priority,
    action: { type: tier.action },
    condition
  }));
}

export function compileCookieRules(state) {
  const policy = snapshotRelevantPolicyState(state, "Cookie policy state", COOKIE_POLICY_STATE_KEYS);
  const mode = Object.hasOwn(policy, "cookieMode") ? policy.cookieMode : "off";
  if (mode === "off") return [];
  if (mode !== "third-party" && mode !== "all") throw new Error(`Unsupported cookie mode: ${mode}`);

  const disabledSites = Object.hasOwn(policy, "disabledSites") && policy.disabledSites != null
    ? snapshotDenseDataArray(policy.disabledSites, "Cookie policy disabledSites", MAX_EXCLUDED_INITIATOR_DOMAINS)
    : [];
  const cookieAllowSites = Object.hasOwn(policy, "cookieAllowSites") && policy.cookieAllowSites != null
    ? snapshotDenseDataArray(policy.cookieAllowSites, "Cookie policy cookieAllowSites", MAX_EXCLUDED_INITIATOR_DOMAINS)
    : [];
  const exceptions = normalizeDomainList([...disabledSites, ...cookieAllowSites]);
  const condition = mode === "third-party"
    ? { domainType: "thirdParty" }
    : { resourceTypes: ALL_RESOURCE_TYPES };

  if (exceptions.length) {
    condition.excludedInitiatorDomains = exceptions;
    condition.excludedRequestDomains = exceptions;
  }

  return [{
    id: COOKIE_RULE_ID,
    priority: COOKIE_RULE_PRIORITY,
    action: {
      type: "modifyHeaders",
      requestHeaders: [{ header: "cookie", operation: "remove" }],
      responseHeaders: [{ header: "set-cookie", operation: "remove" }]
    },
    condition
  }];
}

export function personalPolicyReserveForBudget(maxDynamicRules) {
  if (maxDynamicRules === Number.POSITIVE_INFINITY) return 0;
  if (!Number.isSafeInteger(maxDynamicRules) || maxDynamicRules < 0) throw new Error("Dynamic rule budget must be a non-negative safe integer or Infinity");
  if (maxDynamicRules === 0) return 0;
  return Math.min(PERSONAL_POLICY_RULE_RESERVE, Math.max(1, Math.floor(maxDynamicRules / 10)));
}

export function compileManagedRules(state, options = {}) {
  assertPlainExactObject(options, "compileManagedRules options", COMPILE_MANAGED_OPTION_KEYS);
  const maxDynamicRulesField = readPlainDataField(options, "maxDynamicRules");
  if (!maxDynamicRulesField.safe) throw new Error("compileManagedRules options.maxDynamicRules must be an own enumerable data field when present");
  const maxDynamicRules = maxDynamicRulesField.present
    ? maxDynamicRulesField.value
    : Number.POSITIVE_INFINITY;
  const reserve = personalPolicyReserveForBudget(maxDynamicRules);
  const policy = snapshotManagedPolicyState(state);

  const disabledSiteCandidates = Object.hasOwn(policy, "disabledSites") && policy.disabledSites != null
    ? snapshotDenseDataArray(policy.disabledSites, "Managed policy disabledSites", MAX_EXCLUDED_INITIATOR_DOMAINS)
    : [];
  const cookieAllowCandidates = Object.hasOwn(policy, "cookieAllowSites") && policy.cookieAllowSites != null
    ? snapshotDenseDataArray(policy.cookieAllowSites, "Managed policy cookieAllowSites", MAX_EXCLUDED_INITIATOR_DOMAINS)
    : [];
  const personalAllowCandidates = Object.hasOwn(policy, "personalAllow") && policy.personalAllow != null
    ? snapshotDenseDataArray(policy.personalAllow, "Managed policy personalAllow", MAX_COMPILE_RULE_CANDIDATES)
    : [];

  const disabledSites = normalizeDomainList(disabledSiteCandidates);
  const siteAllowRules = disabledSites.map((value) => ({ kind: "domain", value }));
  const personalAllow = [...personalAllowCandidates, ...siteAllowRules];
  const blockOptions = { excludedInitiatorDomains: disabledSites };

  const cookieRules = compileCookieRules(policy);
  const communityBlockRules = compileRules(policy.communityBlock ?? [], "communityBlock", blockOptions);
  const communityAllowRules = compileRules(policy.communityAllow ?? [], "communityAllow");
  const personalBlockRules = compileRules(policy.personalBlock ?? [], "personalBlock", blockOptions);
  const personalAllowRules = compileRules(personalAllow, "personalAllow");

  const personalCount = cookieRules.length + personalBlockRules.length + personalAllowRules.length;
  const sharedCount = communityBlockRules.length + communityAllowRules.length;

  if (maxDynamicRules !== Number.POSITIVE_INFINITY) {
    const protectedPersonalCapacity = Math.max(personalCount, reserve);
    const sharedBudget = Math.max(0, maxDynamicRules - protectedPersonalCapacity);
    if (sharedCount > sharedBudget) {
      throw new Error(`Shared dynamic rule budget exceeded: ${sharedCount} shared rules for ${sharedBudget} available while preserving ${protectedPersonalCapacity} personal/recovery slots`);
    }
    if (personalCount + sharedCount > maxDynamicRules) {
      throw new Error(`Dynamic rule budget exceeded: ${personalCount + sharedCount} rules for a limit of ${maxDynamicRules}`);
    }
  }

  return [
    ...cookieRules,
    ...communityBlockRules,
    ...communityAllowRules,
    ...personalBlockRules,
    ...personalAllowRules
  ];
}

export function isManagedRuleId(id) {
  return Number.isInteger(id) && id >= MANAGED_RULE_ID_MIN && id <= MANAGED_RULE_ID_MAX;
}
