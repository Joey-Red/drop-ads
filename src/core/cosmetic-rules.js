import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { MAX_CANONICAL_DOMAIN_CHARS, normalizeDomain } from "./rules.js";
import { compareCodeUnitText } from "./text-order.js";

export const MAX_COSMETIC_SELECTOR_LENGTH = 512;
export const MAX_COSMETIC_SELECTOR_INPUT_CHARS = MAX_COSMETIC_SELECTOR_LENGTH * 2;
export const MAX_COSMETIC_DOMAINS = 64;
export const MAX_COSMETIC_SELECTORS_PER_PAGE = 2_048;
export const MAX_COSMETIC_STYLESHEET_BYTES = 256 * 1024;
export const MAX_COSMETIC_RULE_COLLECTION_ITEMS = 300_000;

const COSMETIC_RULE_KEYS = new Set(["selector", "domains", "excludedDomains"]);
const COMPILE_COSMETIC_KEYS = new Set(["hostname", "hide", "allow", "maxSelectors", "maxBytes"]);
const COMPILE_TIERED_COSMETIC_KEYS = new Set([
  "hostname",
  "sharedHide",
  "sharedAllow",
  "personalHide",
  "personalAllow",
  "maxSelectors",
  "maxBytes"
]);
const COSMETIC_RULE_KEY_SEPARATOR = "\u0000";
const COSMETIC_STYLESHEET_SEPARATOR = ",\n";
const COSMETIC_STYLESHEET_SUFFIX = " { display: none !important; }\n";
const TEXT_ENCODER = new TextEncoder();
const COSMETIC_STYLESHEET_SEPARATOR_BYTES = TEXT_ENCODER.encode(COSMETIC_STYLESHEET_SEPARATOR).byteLength;
const COSMETIC_STYLESHEET_SUFFIX_BYTES = TEXT_ENCODER.encode(COSMETIC_STYLESHEET_SUFFIX).byteLength;
const MAX_COSMETIC_DOMAIN_KEY_CHARS = (MAX_COSMETIC_DOMAINS * MAX_CANONICAL_DOMAIN_CHARS) + (MAX_COSMETIC_DOMAINS - 1);
export const MAX_COSMETIC_RULE_KEY_CHARS = MAX_COSMETIC_SELECTOR_LENGTH + 2 + (2 * MAX_COSMETIC_DOMAIN_KEY_CHARS);

function normalizeSelector(value) {
  if (typeof value !== "string") throw new TypeError("Cosmetic selector must be a string");
  if (value.length > MAX_COSMETIC_SELECTOR_INPUT_CHARS) {
    throw new Error(`Cosmetic selector input exceeds ${MAX_COSMETIC_SELECTOR_INPUT_CHARS} characters`);
  }
  const selector = value.trim();
  if (!selector) throw new Error("Cosmetic selector cannot be empty");
  if (selector.length > MAX_COSMETIC_SELECTOR_LENGTH) throw new Error(`Cosmetic selector exceeds ${MAX_COSMETIC_SELECTOR_LENGTH} characters`);
  if (/[^\x09\x20-\x7e]/.test(selector)) throw new Error("Cosmetic selector must use printable ASCII characters");
  if (/[{};]/.test(selector)) throw new Error("Cosmetic rules accept selectors only, not CSS declarations");
  if (/(?:^|[^a-z])(?:url|expression)\s*\(/i.test(selector) || /javascript:|-moz-binding/i.test(selector)) throw new Error("Cosmetic selector contains executable or external-resource syntax");
  if (/#\?#|#\$#|#%#|:has\(|:contains\(|:matches-css\(|:xpath\(|:-abp-/i.test(selector)) throw new Error("Procedural/scriptlet cosmetic syntax is not supported");
  if (selector.startsWith("@") || selector.includes("</")) throw new Error("Cosmetic selector is invalid");
  return selector;
}

function normalizeDomainArray(value, label) {
  if (value == null) return Object.freeze([]);
  const candidates = snapshotDenseDataArray(value, label, MAX_COSMETIC_DOMAINS);
  const normalized = new Set(candidates.map((candidate) => normalizeDomain(candidate)));
  return Object.freeze([...normalized].sort(compareCodeUnitText));
}

function collectionArrayKind(value, label) {
  try {
    return Array.isArray(value);
  } catch {
    throw new TypeError(`${label} array kind is invalid`);
  }
}

function compileLimit(options, key, fallback, maximum, label) {
  if (!Object.hasOwn(options, key) || options[key] === undefined) return fallback;
  const value = options[key];
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${label} must be a non-negative safe integer no greater than ${maximum}`);
  }
  return value;
}

function exactDataSnapshot(value, label, allowedKeys) {
  assertPlainExactObject(value, label, allowedKeys);
  const snapshot = Object.create(null);
  for (const key of allowedKeys) {
    const field = readPlainDataField(value, key);
    if (!field.safe) throw new Error(`${label}.${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  return snapshot;
}

function cosmeticRuleSnapshot(rule) {
  const snapshot = exactDataSnapshot(rule, "Cosmetic rule", COSMETIC_RULE_KEYS);
  if (!Object.hasOwn(snapshot, "selector")) throw new Error("Cosmetic rule is missing field: selector");
  return snapshot;
}

export function normalizeCosmeticRule(rule) {
  const snapshot = cosmeticRuleSnapshot(rule);
  const selector = normalizeSelector(snapshot.selector);
  const domains = normalizeDomainArray(snapshot.domains, "Cosmetic rule domains");
  const excludedDomains = normalizeDomainArray(snapshot.excludedDomains, "Cosmetic rule excludedDomains");
  return Object.freeze({ selector, ...(domains.length ? { domains } : {}), ...(excludedDomains.length ? { excludedDomains } : {}) });
}

export function cosmeticRuleKey(rule) {
  const normalized = normalizeCosmeticRule(rule);
  const key = `${normalized.selector}${COSMETIC_RULE_KEY_SEPARATOR}${(normalized.domains ?? []).join(",")}${COSMETIC_RULE_KEY_SEPARATOR}${(normalized.excludedDomains ?? []).join(",")}`;
  if (key.length > MAX_COSMETIC_RULE_KEY_CHARS) throw new Error("Canonical cosmetic rule key exceeds its derived size limit");
  return key;
}

export function parseCosmeticRuleKey(key) {
  if (typeof key !== "string") throw new TypeError("Cosmetic rule key must be a string");
  if (!key) throw new Error("Cosmetic rule key cannot be empty");
  if (key.length > MAX_COSMETIC_RULE_KEY_CHARS) {
    throw new Error(`Cosmetic rule key exceeds ${MAX_COSMETIC_RULE_KEY_CHARS} characters`);
  }

  const parts = key.split(COSMETIC_RULE_KEY_SEPARATOR);
  if (parts.length !== 3) throw new Error("Cosmetic rule key must contain exactly two separators");
  const [selector, domainText, excludedDomainText] = parts;

  function parseDomainPart(value, label) {
    if (!value) return undefined;
    const entries = value.split(",");
    if (entries.some((entry) => !entry)) throw new Error(`${label} contains an empty domain`);
    if (entries.length > MAX_COSMETIC_DOMAINS) throw new Error(`${label} exceeds ${MAX_COSMETIC_DOMAINS} domains`);
    return entries;
  }

  const domains = parseDomainPart(domainText, "Cosmetic rule key domains");
  const excludedDomains = parseDomainPart(excludedDomainText, "Cosmetic rule key excludedDomains");
  const normalized = normalizeCosmeticRule({
    selector,
    ...(domains ? { domains } : {}),
    ...(excludedDomains ? { excludedDomains } : {})
  });
  if (cosmeticRuleKey(normalized) !== key) throw new Error("Cosmetic rule key is not canonical");
  return normalized;
}

export function normalizeCosmeticRules(value) {
  if (!collectionArrayKind(value, "Cosmetic rules")) return Object.freeze([]);
  const candidates = snapshotDenseDataArray(value, "Cosmetic rules", MAX_COSMETIC_RULE_COLLECTION_ITEMS);
  const deduped = new Map();
  for (const candidate of candidates) {
    try {
      const rule = normalizeCosmeticRule(candidate);
      deduped.set(cosmeticRuleKey(rule), rule);
    } catch {
      // Invalid persisted/shared cosmetic rules fail closed and are discarded.
    }
  }
  return Object.freeze([...deduped.values()].sort((left, right) => compareCodeUnitText(cosmeticRuleKey(left), cosmeticRuleKey(right))));
}

function hostMatchesDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function normalizedRuleMatchesHostname(normalized, host) {
  if ((normalized.excludedDomains ?? []).some((domain) => hostMatchesDomain(host, domain))) return false;
  const domains = normalized.domains ?? [];
  return domains.length === 0 || domains.some((domain) => hostMatchesDomain(host, domain));
}

export function cosmeticRuleMatchesHostname(rule, hostname) {
  return normalizedRuleMatchesHostname(normalizeCosmeticRule(rule), normalizeDomain(hostname));
}

function matchingSelectorSet(rules, hostname) {
  const selectors = new Set();
  for (const rule of normalizeCosmeticRules(rules)) if (normalizedRuleMatchesHostname(rule, hostname)) selectors.add(rule.selector);
  return selectors;
}

function appendWithinLimits(target, candidates, maxSelectors, maxBytes, byteState, accepted) {
  for (const selector of candidates) {
    if (accepted.has(selector)) continue;
    if (target.length >= maxSelectors) break;
    const selectorBytes = TEXT_ENCODER.encode(selector).byteLength;
    const projectedBytes = target.length === 0
      ? selectorBytes + COSMETIC_STYLESHEET_SUFFIX_BYTES
      : byteState.bytes + COSMETIC_STYLESHEET_SEPARATOR_BYTES + selectorBytes;
    if (projectedBytes > maxBytes) break;
    target.push(selector);
    accepted.add(selector);
    byteState.bytes = projectedBytes;
  }
}

export function compileCosmeticSelectors(options = {}) {
  const snapshot = exactDataSnapshot(options, "Cosmetic compile options", COMPILE_COSMETIC_KEYS);
  const maxSelectors = compileLimit(
    snapshot,
    "maxSelectors",
    MAX_COSMETIC_SELECTORS_PER_PAGE,
    MAX_COSMETIC_SELECTORS_PER_PAGE,
    "Cosmetic maxSelectors"
  );
  const maxBytes = compileLimit(
    snapshot,
    "maxBytes",
    MAX_COSMETIC_STYLESHEET_BYTES,
    MAX_COSMETIC_STYLESHEET_BYTES,
    "Cosmetic maxBytes"
  );
  const host = normalizeDomain(snapshot.hostname);
  const allowed = matchingSelectorSet(snapshot.allow ?? [], host);
  const candidates = [...matchingSelectorSet(snapshot.hide ?? [], host)].filter((selector) => !allowed.has(selector)).sort(compareCodeUnitText);
  const selectors = [];
  appendWithinLimits(selectors, candidates, maxSelectors, maxBytes, { bytes: 0 }, new Set());
  return selectors;
}

export function compileTieredCosmeticSelectors(options = {}) {
  const snapshot = exactDataSnapshot(options, "Tiered cosmetic compile options", COMPILE_TIERED_COSMETIC_KEYS);
  const maxSelectors = compileLimit(
    snapshot,
    "maxSelectors",
    MAX_COSMETIC_SELECTORS_PER_PAGE,
    MAX_COSMETIC_SELECTORS_PER_PAGE,
    "Tiered cosmetic maxSelectors"
  );
  const maxBytes = compileLimit(
    snapshot,
    "maxBytes",
    MAX_COSMETIC_STYLESHEET_BYTES,
    MAX_COSMETIC_STYLESHEET_BYTES,
    "Tiered cosmetic maxBytes"
  );
  const host = normalizeDomain(snapshot.hostname);
  const personalAllowed = matchingSelectorSet(snapshot.personalAllow ?? [], host);
  const personalHidden = matchingSelectorSet(snapshot.personalHide ?? [], host);
  const sharedAllowed = matchingSelectorSet(snapshot.sharedAllow ?? [], host);
  const sharedHidden = matchingSelectorSet(snapshot.sharedHide ?? [], host);
  const personalCandidates = [...personalHidden].filter((selector) => !personalAllowed.has(selector)).sort(compareCodeUnitText);
  const sharedCandidates = [...sharedHidden]
    .filter((selector) => !personalAllowed.has(selector) && !personalHidden.has(selector) && !sharedAllowed.has(selector))
    .sort(compareCodeUnitText);
  const selectors = [];
  const byteState = { bytes: 0 };
  const accepted = new Set();
  appendWithinLimits(selectors, personalCandidates, maxSelectors, maxBytes, byteState, accepted);
  appendWithinLimits(selectors, sharedCandidates, maxSelectors, maxBytes, byteState, accepted);
  return selectors;
}

export function cosmeticStylesheet(selectors) {
  if (!collectionArrayKind(selectors, "Cosmetic stylesheet selectors")) return "";
  const candidates = snapshotDenseDataArray(selectors, "Cosmetic stylesheet selectors", MAX_COSMETIC_SELECTORS_PER_PAGE);
  if (candidates.length === 0) return "";
  const normalized = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const selector = normalizeSelector(candidate);
    if (seen.has(selector)) continue;
    seen.add(selector);
    normalized.push(selector);
  }
  if (normalized.length === 0) return "";
  const stylesheet = `${normalized.join(COSMETIC_STYLESHEET_SEPARATOR)}${COSMETIC_STYLESHEET_SUFFIX}`;
  if (TEXT_ENCODER.encode(stylesheet).byteLength > MAX_COSMETIC_STYLESHEET_BYTES) {
    throw new Error(`Cosmetic stylesheet exceeds ${MAX_COSMETIC_STYLESHEET_BYTES} bytes`);
  }
  return stylesheet;
}
