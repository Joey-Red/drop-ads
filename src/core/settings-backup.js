import { normalizeDomain, normalizeRule, ruleKey } from "./rules.js";
import { cosmeticRuleKey, normalizeCosmeticRule } from "./cosmetic-rules.js";
import { BUILT_IN_SUBSCRIPTIONS, normalizeSubscription, normalizeSubscriptions, subscriptionSourceKey } from "./subscriptions.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const SETTINGS_BACKUP_FORMAT = "drop-ads-settings";
export const SETTINGS_BACKUP_VERSION = 1;
export const MAX_SETTINGS_BACKUP_BYTES = 1_000_000;
export const SETTINGS_BACKUP_LIMITS = Object.freeze({ personalRules: 10_000, cosmeticRules: 5_000, domains: 5_000, subscriptions: 128 });

const BUILT_IN_BY_ID = new Map(BUILT_IN_SUBSCRIPTIONS.map((subscription) => [subscription.id, subscription]));
const BUILT_IN_SOURCE_KEYS = new Set(BUILT_IN_SUBSCRIPTIONS.map((subscription) => subscriptionSourceKey(subscription)));
const COOKIE_MODES = new Set(["off", "third-party", "all"]);
const COOKIE_BANNER_MODES = new Set(["off", "reject"]);
const BACKUP_KEYS = new Set(["format", "version", "settings"]);
const SETTINGS_KEYS = new Set(["enabled", "autoSubmitCommunity", "updateIntervalHours", "cookieMode", "cookieBannerMode", "cookieBannerDisabledSites", "cookieAllowSites", "personalBlock", "personalAllow", "personalCosmeticHide", "personalCosmeticAllow", "disabledSites", "subscriptions"]);
const REQUIRED_IMPORT_SETTINGS_KEYS = Object.freeze(["enabled", "autoSubmitCommunity", "updateIntervalHours", "cookieMode", "cookieAllowSites", "personalBlock", "personalAllow", "disabledSites", "subscriptions"]);
const BUILT_IN_SUBSCRIPTION_KEYS = new Set(["id", "enabled"]);
const EXTERNAL_SUBSCRIPTION_KEYS = new Set(["title", "format", "sourceUrl", "enabled"]);
const SUBSCRIPTION_RECORD_KEYS = new Set([...BUILT_IN_SUBSCRIPTION_KEYS, ...EXTERNAL_SUBSCRIPTION_KEYS]);

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

export function assertExactKeys(value, label, allowedKeys) { assertPlainExactObject(value, label, allowedKeys); return value; }
function assertOptionalBoolean(object, key, label) { if (Object.hasOwn(object, key) && typeof object[key] !== "boolean") throw new Error(`${label}.${key} must be boolean`); }
export function assertBackupCollectionBound(value, label, limit) { return snapshotDenseDataArray(value, label, limit); }

function normalizeRulesStrict(value, label) {
  const candidates = assertBackupCollectionBound(value, label, SETTINGS_BACKUP_LIMITS.personalRules);
  const deduped = new Map();
  for (const candidate of candidates) {
    const rule = normalizeRule(candidate);
    const key = ruleKey(rule);
    if (deduped.has(key)) throw new Error(`${label} contains a duplicate canonical rule`);
    deduped.set(key, rule);
  }
  return [...deduped.values()];
}

function normalizeCosmeticRulesStrict(value, label, { optional = false } = {}) {
  if (value == null && optional) return [];
  const candidates = assertBackupCollectionBound(value, label, SETTINGS_BACKUP_LIMITS.cosmeticRules);
  const deduped = new Map();
  for (const candidate of candidates) {
    const rule = normalizeCosmeticRule(candidate);
    const key = cosmeticRuleKey(rule);
    if (deduped.has(key)) throw new Error(`${label} contains a duplicate canonical cosmetic rule`);
    deduped.set(key, rule);
  }
  return [...deduped.values()].sort((a, b) => cosmeticRuleKey(a).localeCompare(cosmeticRuleKey(b)));
}

function normalizeDomainsStrict(value, label) {
  const candidates = assertBackupCollectionBound(value, label, SETTINGS_BACKUP_LIMITS.domains);
  const normalized = new Set();
  for (const candidate of candidates) {
    const domain = normalizeDomain(candidate);
    if (normalized.has(domain)) throw new Error(`${label} contains a duplicate canonical domain`);
    normalized.add(domain);
  }
  return [...normalized].sort();
}

function normalizeUpdateInterval(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 168) throw new Error("updateIntervalHours must be a finite number between 1 and 168");
  return value;
}
function normalizeCookieBannerMode(value, fallback = null) {
  if (typeof value === "string" && COOKIE_BANNER_MODES.has(value)) return value;
  if (fallback != null) return fallback;
  throw new Error("cookieBannerMode is invalid");
}
function assertSerializedBackupBound(backup) {
  const serialized = JSON.stringify(backup);
  if (serialized.length > MAX_SETTINGS_BACKUP_BYTES) throw new Error("Settings backup is too large");
  if (new TextEncoder().encode(serialized).byteLength > MAX_SETTINGS_BACKUP_BYTES) throw new Error("Settings backup is too large");
  return backup;
}

function freezeCanonicalData(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") throw new TypeError("Canonical settings backup cannot contain symbol fields");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) throw new TypeError("Canonical settings backup must contain data fields only");
    freezeCanonicalData(descriptor.value);
  }
  return Object.freeze(value);
}

function exportSubscription(subscription) {
  const normalized = normalizeSubscription(subscription);
  if (BUILT_IN_BY_ID.has(normalized.id)) return { id: normalized.id, enabled: normalized.enabled };
  return { title: normalized.title, format: normalized.format, sourceUrl: normalized.sourceUrl, enabled: normalized.enabled };
}
function exportSubscriptions(value) {
  const candidates = assertBackupCollectionBound(value, "subscriptions", SETTINGS_BACKUP_LIMITS.subscriptions);
  return normalizeSubscriptions(candidates).map(exportSubscription);
}
function importSubscriptions(value) {
  const source = assertBackupCollectionBound(value, "subscriptions", SETTINGS_BACKUP_LIMITS.subscriptions);
  const candidates = [];
  const seenBuiltInIds = new Set();
  const seenExternalSources = new Set();
  let externalIndex = 0;
  for (const raw of source) {
    const item = exactDataSnapshot(raw, "subscription", SUBSCRIPTION_RECORD_KEYS);
    if (typeof item.id === "string") {
      assertExactKeys(item, "built-in subscription", BUILT_IN_SUBSCRIPTION_KEYS);
      assertOptionalBoolean(item, "enabled", "built-in subscription");
      const builtIn = BUILT_IN_BY_ID.get(item.id);
      if (!builtIn) throw new Error("Only canonical built-in subscription ids may appear in a settings backup");
      if (seenBuiltInIds.has(item.id)) throw new Error(`Settings backup repeats built-in subscription id ${item.id}`);
      seenBuiltInIds.add(item.id);
      candidates.push({ ...builtIn, enabled: Object.hasOwn(item, "enabled") ? item.enabled : builtIn.enabled });
      continue;
    }
    assertExactKeys(item, "external subscription", EXTERNAL_SUBSCRIPTION_KEYS);
    assertOptionalBoolean(item, "enabled", "external subscription");
    externalIndex += 1;
    const normalized = normalizeSubscription({ id: `external-import-${externalIndex}`, title: item.title, format: item.format, sourceUrl: item.sourceUrl, enabled: item.enabled !== false, builtIn: false });
    const sourceKey = subscriptionSourceKey(normalized);
    if (BUILT_IN_SOURCE_KEYS.has(sourceKey)) throw new Error("Settings backup external subscription duplicates a canonical built-in source");
    if (seenExternalSources.has(sourceKey)) throw new Error("Settings backup repeats an external subscription source");
    seenExternalSources.add(sourceKey);
    candidates.push(normalized);
  }
  return normalizeSubscriptions(candidates);
}

export function createSettingsBackup(state) {
  const source = exactDataSnapshot(state, "state", SETTINGS_KEYS);
  for (const key of SETTINGS_KEYS) if (!Object.hasOwn(source, key)) throw new Error(`state is missing required field ${key}`);
  if (typeof source.enabled !== "boolean") throw new Error("state.enabled must be boolean");
  if (typeof source.autoSubmitCommunity !== "boolean") throw new Error("state.autoSubmitCommunity must be boolean");
  if (!COOKIE_MODES.has(source.cookieMode)) throw new Error("cookieMode is invalid");
  const settings = {
    enabled: source.enabled,
    autoSubmitCommunity: source.autoSubmitCommunity,
    updateIntervalHours: normalizeUpdateInterval(source.updateIntervalHours),
    cookieMode: source.cookieMode,
    cookieBannerMode: normalizeCookieBannerMode(source.cookieBannerMode),
    cookieBannerDisabledSites: normalizeDomainsStrict(source.cookieBannerDisabledSites, "cookieBannerDisabledSites"),
    cookieAllowSites: normalizeDomainsStrict(source.cookieAllowSites, "cookieAllowSites"),
    personalBlock: normalizeRulesStrict(source.personalBlock, "personalBlock"),
    personalAllow: normalizeRulesStrict(source.personalAllow, "personalAllow"),
    personalCosmeticHide: normalizeCosmeticRulesStrict(source.personalCosmeticHide, "personalCosmeticHide"),
    personalCosmeticAllow: normalizeCosmeticRulesStrict(source.personalCosmeticAllow, "personalCosmeticAllow"),
    disabledSites: normalizeDomainsStrict(source.disabledSites, "disabledSites"),
    subscriptions: exportSubscriptions(source.subscriptions)
  };
  return freezeCanonicalData(assertSerializedBackupBound({ format: SETTINGS_BACKUP_FORMAT, version: SETTINGS_BACKUP_VERSION, settings }));
}

export function parseSettingsBackup(input) {
  if (typeof input === "string") {
    if (input.length > MAX_SETTINGS_BACKUP_BYTES) throw new Error("Settings backup is too large");
    if (new TextEncoder().encode(input).byteLength > MAX_SETTINGS_BACKUP_BYTES) throw new Error("Settings backup is too large");
  }
  const backup = typeof input === "string" ? JSON.parse(input) : input;
  const backupSnapshot = exactDataSnapshot(backup, "backup", BACKUP_KEYS);
  if (backupSnapshot.format !== SETTINGS_BACKUP_FORMAT) throw new Error("Unsupported settings backup format");
  if (!Number.isSafeInteger(backupSnapshot.version) || backupSnapshot.version !== SETTINGS_BACKUP_VERSION) throw new Error("Unsupported settings backup version");
  const source = exactDataSnapshot(backupSnapshot.settings, "backup.settings", SETTINGS_KEYS);
  for (const key of REQUIRED_IMPORT_SETTINGS_KEYS) if (!Object.hasOwn(source, key)) throw new Error(`backup.settings is missing required field ${key}`);
  if (typeof source.enabled !== "boolean") throw new Error("enabled must be boolean");
  if (typeof source.autoSubmitCommunity !== "boolean") throw new Error("autoSubmitCommunity must be boolean");
  if (!COOKIE_MODES.has(source.cookieMode)) throw new Error("cookieMode is invalid");
  return freezeCanonicalData({
    enabled: source.enabled,
    autoSubmitCommunity: source.autoSubmitCommunity,
    updateIntervalHours: normalizeUpdateInterval(source.updateIntervalHours),
    cookieMode: source.cookieMode,
    cookieBannerMode: normalizeCookieBannerMode(source.cookieBannerMode, "reject"),
    cookieBannerDisabledSites: normalizeDomainsStrict(source.cookieBannerDisabledSites ?? [], "cookieBannerDisabledSites"),
    cookieAllowSites: normalizeDomainsStrict(source.cookieAllowSites, "cookieAllowSites"),
    personalBlock: normalizeRulesStrict(source.personalBlock, "personalBlock"),
    personalAllow: normalizeRulesStrict(source.personalAllow, "personalAllow"),
    personalCosmeticHide: normalizeCosmeticRulesStrict(source.personalCosmeticHide, "personalCosmeticHide", { optional: true }),
    personalCosmeticAllow: normalizeCosmeticRulesStrict(source.personalCosmeticAllow, "personalCosmeticAllow", { optional: true }),
    disabledSites: normalizeDomainsStrict(source.disabledSites, "disabledSites"),
    subscriptions: importSubscriptions(source.subscriptions)
  });
}
