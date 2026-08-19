import { ruleKey } from "./rules.js";
import { cosmeticRuleKey } from "./cosmetic-rules.js";
import { normalizeRemoteCosmeticRule } from "./cosmetic-lists.js";
import { NATIVE_LIST_FORMAT, assertRemoteRuleSafe } from "./lists.js";
import { MAX_RAW_CACHE_POLICY_ITEMS, decodeCacheEntry } from "./cache-codec.js";
import { assertListCacheStorageBound, snapshotRawListCache } from "./cache-storage.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";

export const MAX_SUBSCRIPTION_ID_CHARS = 96;
export const MAX_SUBSCRIPTION_TITLE_CHARS = 120;
export const MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS = 4_096;
export const MAX_SUBSCRIPTION_SOURCE_URL_CHARS = 4_000;
export const MAX_NORMALIZED_SUBSCRIPTIONS = 128;

export const DEFAULT_COMMUNITY_SUBSCRIPTION = Object.freeze({
  id: "drop-ads-default",
  title: "Drop Ads Community",
  format: NATIVE_LIST_FORMAT,
  sourceUrl: "https://raw.githubusercontent.com/Joey-Red/drop-ads/main/lists/default.txt",
  enabled: true,
  builtIn: true
});

export const HAGEZI_PRO_MINI_SUBSCRIPTION = Object.freeze({
  id: "hagezi-pro-mini",
  title: "HaGeZi Pro mini",
  format: "third-party",
  sourceUrl: "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.mini.txt",
  enabled: true,
  builtIn: true
});

export const STEVENBLACK_HOSTS_SUBSCRIPTION = Object.freeze({
  id: "stevenblack-hosts",
  title: "StevenBlack Unified Hosts",
  format: "hosts",
  sourceUrl: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
  enabled: false,
  builtIn: true
});

export const BLOCKLIST_PROJECT_ADS_SUBSCRIPTION = Object.freeze({
  id: "blocklist-project-ads",
  title: "Block List Project — Ads",
  format: "third-party",
  sourceUrl: "https://raw.githubusercontent.com/blocklistproject/Lists/main/alt-version/ads-nl.txt",
  enabled: false,
  builtIn: true
});

export const ANUDEEP_ADSERVERS_SUBSCRIPTION = Object.freeze({
  id: "anudeep-adservers",
  title: "anudeepND Adservers",
  format: "hosts",
  sourceUrl: "https://raw.githubusercontent.com/anudeepND/blacklist/master/adservers.txt",
  enabled: false,
  builtIn: true
});

export const BUILT_IN_SUBSCRIPTIONS = Object.freeze([
  DEFAULT_COMMUNITY_SUBSCRIPTION,
  HAGEZI_PRO_MINI_SUBSCRIPTION,
  STEVENBLACK_HOSTS_SUBSCRIPTION,
  BLOCKLIST_PROJECT_ADS_SUBSCRIPTION,
  ANUDEEP_ADSERVERS_SUBSCRIPTION
]);

const FORMATS = new Set([NATIVE_LIST_FORMAT, "third-party", "hosts"]);
const BUILT_IN_IDS = new Set(BUILT_IN_SUBSCRIPTIONS.map((subscription) => subscription.id));
const SUBSCRIPTION_KEYS = new Set(["id", "title", "format", "sourceUrl", "enabled", "builtIn"]);
const REQUIRED_SUBSCRIPTION_KEYS = ["id", "title", "format", "sourceUrl"];
const UNSAFE_SUBSCRIPTION_TITLE_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;

export function isSubscriptionTitleTextSafe(value) {
  return typeof value === "string"
    && Boolean(value.trim())
    && value.length <= MAX_SUBSCRIPTION_TITLE_CHARS
    && !UNSAFE_SUBSCRIPTION_TITLE_TEXT.test(value);
}

function assertPublicSubscriptionSource(source) {
  try {
    assertRemoteRuleSafe({ kind: "url", value: source.href });
  } catch {
    throw new Error("Subscription source must use a public network host");
  }
}

function subscriptionSnapshot(subscription) {
  assertPlainExactObject(subscription, "Subscription", SUBSCRIPTION_KEYS);
  const snapshot = Object.create(null);
  for (const key of SUBSCRIPTION_KEYS) {
    const field = readPlainDataField(subscription, key);
    if (!field.safe) throw new Error(`Subscription ${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  for (const key of REQUIRED_SUBSCRIPTION_KEYS) {
    if (!Object.hasOwn(snapshot, key)) throw new Error(`Subscription is missing field: ${key}`);
  }
  return snapshot;
}

function frozenSubscription(record) {
  return Object.freeze({
    id: record.id,
    title: record.title,
    format: record.format,
    sourceUrl: record.sourceUrl,
    enabled: record.enabled,
    builtIn: record.builtIn
  });
}

function frozenNetworkRule(rule) {
  const resourceTypes = rule.resourceTypes?.length ? Object.freeze([...rule.resourceTypes]) : undefined;
  return Object.freeze({
    kind: rule.kind,
    value: rule.value,
    ...(resourceTypes ? { resourceTypes } : {})
  });
}

function frozenPair(firstKey, firstValues, secondKey, secondValues) {
  return Object.freeze({
    [firstKey]: Object.freeze([...firstValues]),
    [secondKey]: Object.freeze([...secondValues])
  });
}

function canonicalSubscriptionSourceKey(subscription) {
  return `${subscription.format}\u0000${subscription.sourceUrl}`;
}

export function normalizeSubscription(subscription) {
  const sourceRecord = subscriptionSnapshot(subscription);
  if (Object.hasOwn(sourceRecord, "enabled") && typeof sourceRecord.enabled !== "boolean") {
    throw new Error("Subscription enabled must be boolean");
  }
  if (Object.hasOwn(sourceRecord, "builtIn") && typeof sourceRecord.builtIn !== "boolean") {
    throw new Error("Subscription builtIn must be boolean");
  }
  if (typeof sourceRecord.id !== "string" || sourceRecord.id.length > MAX_SUBSCRIPTION_ID_CHARS || !/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(sourceRecord.id)) throw new Error("Subscription id is invalid");
  if (!isSubscriptionTitleTextSafe(sourceRecord.title)) throw new Error("Subscription title is invalid");
  if (!FORMATS.has(sourceRecord.format)) throw new Error("Subscription format is invalid");
  if (typeof sourceRecord.sourceUrl !== "string" || !sourceRecord.sourceUrl || sourceRecord.sourceUrl.length > MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS) {
    throw new Error(`Subscription source URL must be at most ${MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS} characters before normalization`);
  }
  const source = new URL(sourceRecord.sourceUrl);
  if (source.protocol !== "https:") throw new Error("Subscription source must use HTTPS");
  if (source.username || source.password) throw new Error("Subscription source cannot contain URL credentials");
  source.hash = "";
  if (source.href.length > MAX_SUBSCRIPTION_SOURCE_URL_CHARS) {
    throw new Error(`Subscription source URL must be at most ${MAX_SUBSCRIPTION_SOURCE_URL_CHARS} canonical characters`);
  }
  assertPublicSubscriptionSource(source);

  return frozenSubscription({
    id: sourceRecord.id,
    title: sourceRecord.title.trim(),
    format: sourceRecord.format,
    sourceUrl: source.href,
    enabled: Object.hasOwn(sourceRecord, "enabled") ? sourceRecord.enabled : true,
    builtIn: Object.hasOwn(sourceRecord, "builtIn") ? sourceRecord.builtIn : false
  });
}

export function subscriptionSourceKey(subscription) {
  return canonicalSubscriptionSourceKey(normalizeSubscription(subscription));
}

function subscriptionCandidatesSnapshot(subscriptions) {
  let isArray;
  try { isArray = Array.isArray(subscriptions); }
  catch { throw new TypeError("Subscriptions array kind is invalid"); }
  if (!isArray) return [];
  return snapshotDenseDataArray(subscriptions, "Subscriptions", MAX_NORMALIZED_SUBSCRIPTIONS);
}

function cacheEnvelope(cache) {
  return snapshotRawListCache(cache);
}

export function normalizeSubscriptions(subscriptions) {
  const candidates = subscriptionCandidatesSnapshot(subscriptions);
  const normalizedCandidates = [];
  const enabledByBuiltInId = new Map();

  for (const candidate of candidates) {
    try {
      const subscription = normalizeSubscription(candidate);
      normalizedCandidates.push(subscription);
      if (BUILT_IN_IDS.has(subscription.id) && !enabledByBuiltInId.has(subscription.id)) enabledByBuiltInId.set(subscription.id, subscription.enabled);
    } catch {
      // Invalid persisted subscriptions are ignored rather than becoming network policy.
    }
  }

  const result = [];
  const seenIds = new Set();
  const seenSources = new Set();
  for (const builtIn of BUILT_IN_SUBSCRIPTIONS) {
    const subscription = frozenSubscription({
      ...builtIn,
      enabled: enabledByBuiltInId.has(builtIn.id) ? enabledByBuiltInId.get(builtIn.id) : builtIn.enabled
    });
    result.push(subscription);
    seenIds.add(subscription.id);
    seenSources.add(canonicalSubscriptionSourceKey(subscription));
  }
  for (const subscription of normalizedCandidates) {
    if (BUILT_IN_IDS.has(subscription.id)) continue;
    const sourceKey = canonicalSubscriptionSourceKey(subscription);
    if (seenIds.has(subscription.id) || seenSources.has(sourceKey)) continue;
    const external = frozenSubscription({ ...subscription, builtIn: false });
    result.push(external);
    seenIds.add(external.id);
    seenSources.add(sourceKey);
  }
  return Object.freeze(result);
}

function decodedCacheForSubscription(subscription, rawEntry) {
  const decoded = decodeCacheEntry(rawEntry);
  if (!decoded) return null;
  if (decoded.sourceKey && decoded.sourceKey !== canonicalSubscriptionSourceKey(subscription)) return null;
  return decoded;
}

export function pruneListCache(subscriptions, cache) {
  const configured = normalizeSubscriptions(subscriptions);
  const sourceCache = cacheEnvelope(cache);
  const pruned = Object.create(null);
  for (const subscription of configured) {
    if (!Object.hasOwn(sourceCache, subscription.id)) continue;
    const rawEntry = sourceCache[subscription.id];
    if (!decodedCacheForSubscription(subscription, rawEntry)) continue;
    Object.defineProperty(pruned, subscription.id, {
      value: rawEntry,
      enumerable: true,
      configurable: true,
      writable: true
    });
  }
  return pruned;
}

function cachePolicyCandidates(candidates, label) {
  try {
    return snapshotDenseDataArray(candidates, label, MAX_RAW_CACHE_POLICY_ITEMS);
  } catch {
    return [];
  }
}

function appendValidRules(target, candidates) {
  for (const candidate of cachePolicyCandidates(candidates, "Decoded cache network rules")) {
    try {
      const rule = frozenNetworkRule(assertRemoteRuleSafe(candidate));
      target.set(ruleKey(rule), rule);
    } catch {
      // Corrupt or newly forbidden legacy cache entries are ignored and repaired on refresh.
    }
  }
}

function appendValidCosmetics(target, candidates) {
  for (const candidate of cachePolicyCandidates(candidates, "Decoded cache cosmetic rules")) {
    try {
      const rule = normalizeRemoteCosmeticRule(candidate);
      target.set(cosmeticRuleKey(rule), rule);
    } catch {
      // Corrupt/newly unsafe cosmetic cache entries fail closed and are repaired on refresh.
    }
  }
}

export function mergeCachedRules(subscriptions, cache) {
  const block = new Map();
  const allow = new Map();
  const sourceCache = cacheEnvelope(cache);
  assertListCacheStorageBound(sourceCache);
  for (const subscription of normalizeSubscriptions(subscriptions)) {
    if (!subscription.enabled) continue;
    const entry = decodedCacheForSubscription(subscription, sourceCache[subscription.id]);
    if (!entry) continue;
    appendValidRules(block, entry.block);
    appendValidRules(allow, entry.allow);
  }
  return frozenPair("block", block.values(), "allow", allow.values());
}

export function mergeCachedCosmeticRules(subscriptions, cache) {
  const hide = new Map();
  const allow = new Map();
  const sourceCache = cacheEnvelope(cache);
  assertListCacheStorageBound(sourceCache);
  for (const subscription of normalizeSubscriptions(subscriptions)) {
    if (!subscription.enabled) continue;
    const entry = decodedCacheForSubscription(subscription, sourceCache[subscription.id]);
    if (!entry) continue;
    appendValidCosmetics(hide, entry.cosmeticHide);
    appendValidCosmetics(allow, entry.cosmeticAllow);
  }
  return frozenPair("hide", hide.values(), "allow", allow.values());
}
