import { assertRemoteRuleSafe } from "./lists.js";
import { MAX_COSMETIC_DOMAINS, cosmeticRuleKey } from "./cosmetic-rules.js";
import { normalizeRemoteCosmeticRule } from "./cosmetic-lists.js";
import { MAX_NETWORK_RULE_RESOURCE_TYPES, ruleKey } from "./rules.js";
import { snapshotDenseDataArray } from "./object-schema.js";
import { snapshotRawListCache } from "./cache-storage.js";
import { compareCodeUnitText } from "./text-order.js";

export const CACHE_ENTRY_VERSION = 5;
export const MAX_RAW_CACHE_POLICY_ITEMS = 300_000;
export const MAX_CACHE_SOURCE_URL_INPUT_CHARS = 4_096;
export const MAX_CACHE_SOURCE_URL_CHARS = 4_000;

const KIND_TO_CODE = Object.freeze({ domain: "d", url: "u", pattern: "p" });
const CODE_TO_KIND = Object.freeze({ d: "domain", u: "url", p: "pattern" });
const CACHE_SOURCE_FORMATS = new Set(["drop-ads-v1", "third-party", "hosts"]);
const RULE_PACK_KEYS = new Set(["d", "u", "p", "r"]);
const LEGACY_ENTRY_KEYS = new Set(["block", "allow", "cosmeticHide", "cosmeticAllow", "nextRefreshAt"]);
const LEGACY_POLICY_ARRAY_KEYS = Object.freeze(["block", "allow", "cosmeticHide", "cosmeticAllow"]);
const ENCODE_ENTRY_KEYS = new Set(["block", "allow", "cosmeticHide", "cosmeticAllow", "sourceKey"]);
const EMPTY_POLICY_ARRAY = Object.freeze([]);
const ENTRY_KEYS_BY_VERSION = new Map([
  [2, new Set(["v", "b", "a", "n"])],
  [3, new Set(["v", "b", "a", "h", "x", "n"])],
  [4, new Set(["v", "b", "a", "h", "x", "c", "n"])],
  [CACHE_ENTRY_VERSION, new Set(["v", "b", "a", "h", "x", "c", "s", "n"])]
]);

function plainDataSnapshot(value) {
  let isArray;
  let prototype;
  let ownKeys;
  try {
    isArray = Array.isArray(value);
    if (!value || typeof value !== "object" || isArray) return null;
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  if (prototype !== Object.prototype && prototype !== null) return null;
  if (ownKeys.some((key) => typeof key === "symbol")) return null;

  const snapshot = Object.create(null);
  for (const key of ownKeys) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { return null; }
    if (!descriptor?.enumerable || !("value" in descriptor)) return null;
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function hasOnlyKeys(snapshot, allowed) {
  return Object.keys(snapshot).every((key) => allowed.has(key));
}

function finiteRefreshTime(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function denseArrayOrNull(value, label, maxLength) {
  try { return snapshotDenseDataArray(value, label, maxLength); }
  catch { return null; }
}

function inspectArrayKind(value) {
  try { return Array.isArray(value); }
  catch { return null; }
}

function detachedArrayLength(value, label) {
  if (value == null) return 0;
  let isArray;
  let prototype;
  let descriptor;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    descriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    throw new TypeError(`${label} detached array is invalid`);
  }
  if (!isArray || prototype !== Array.prototype || !descriptor || !("value" in descriptor)
    || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0) {
    throw new TypeError(`${label} must already be a detached dense array`);
  }
  return descriptor.value;
}

function frozenNetworkRule(rule) {
  const resourceTypes = rule.resourceTypes?.length ? Object.freeze([...rule.resourceTypes]) : undefined;
  return Object.freeze({
    kind: rule.kind,
    value: rule.value,
    ...(resourceTypes ? { resourceTypes } : {})
  });
}

function frozenDecodedPolicy(decoded, sourceKey) {
  return Object.freeze({
    block: decoded.block,
    allow: decoded.allow,
    cosmeticHide: decoded.cosmeticHide,
    cosmeticAllow: decoded.cosmeticAllow,
    nextRefreshAt: decoded.nextRefreshAt,
    ...(sourceKey ? { sourceKey } : {})
  });
}

function rulePackSnapshot(pack) {
  if (pack == null) return Object.create(null);
  const snapshot = plainDataSnapshot(pack);
  if (!snapshot || !hasOnlyKeys(snapshot, RULE_PACK_KEYS)) return null;

  for (const code of ["d", "u", "p", "r"]) {
    if (!Object.hasOwn(snapshot, code)) continue;
    const values = denseArrayOrNull(snapshot[code], `Cache rule pack.${code}`, MAX_RAW_CACHE_POLICY_ITEMS);
    if (!values) return null;
    snapshot[code] = values;
  }
  return snapshot;
}

function cosmeticPackSnapshot(pack, label) {
  if (pack == null) return [];
  return denseArrayOrNull(pack, label, MAX_RAW_CACHE_POLICY_ITEMS);
}

function rulePackItemCount(snapshot) {
  return detachedArrayLength(snapshot.d, "Cache rule pack.d")
    + detachedArrayLength(snapshot.u, "Cache rule pack.u")
    + detachedArrayLength(snapshot.p, "Cache rule pack.p")
    + detachedArrayLength(snapshot.r, "Cache rule pack.r");
}

function rulePackLength(pack) {
  const snapshot = rulePackSnapshot(pack);
  return snapshot ? rulePackItemCount(snapshot) : 0;
}

function entrySnapshotWithValidPacks(entry) {
  const snapshot = plainDataSnapshot(entry);
  if (!snapshot) return null;

  if (Object.hasOwn(snapshot, "v")) {
    const allowed = ENTRY_KEYS_BY_VERSION.get(snapshot.v);
    if (!allowed || !hasOnlyKeys(snapshot, allowed)) return null;
    if (snapshot.b != null) {
      const block = rulePackSnapshot(snapshot.b);
      if (!block) return null;
      snapshot.b = block;
    }
    if (snapshot.a != null) {
      const allow = rulePackSnapshot(snapshot.a);
      if (!allow) return null;
      snapshot.a = allow;
    }
    if (snapshot.h != null) {
      const hide = cosmeticPackSnapshot(snapshot.h, "Cache cosmetic hide pack");
      if (!hide) return null;
      snapshot.h = hide;
    }
    if (snapshot.x != null) {
      const allow = cosmeticPackSnapshot(snapshot.x, "Cache cosmetic allow pack");
      if (!allow) return null;
      snapshot.x = allow;
    }
    return snapshot;
  }

  if (!hasOnlyKeys(snapshot, LEGACY_ENTRY_KEYS)) return null;
  for (const key of LEGACY_POLICY_ARRAY_KEYS) {
    if (!Object.hasOwn(snapshot, key)) continue;
    const isArray = inspectArrayKind(snapshot[key]);
    if (isArray == null) return null;
    if (!isArray) {
      snapshot[key] = null;
      continue;
    }
    const values = denseArrayOrNull(snapshot[key], `Legacy cache entry.${key}`, MAX_RAW_CACHE_POLICY_ITEMS);
    if (!values) return null;
    snapshot[key] = values;
  }
  return snapshot;
}

function rawCacheEntryItemCountFromSnapshot(entry) {
  if ([2, 3, 4, CACHE_ENTRY_VERSION].includes(entry.v)) {
    return rulePackLength(entry.b)
      + rulePackLength(entry.a)
      + detachedArrayLength(entry.h, "Cache cosmetic hide pack")
      + detachedArrayLength(entry.x, "Cache cosmetic allow pack");
  }
  return detachedArrayLength(entry.block, "Legacy cache block")
    + detachedArrayLength(entry.allow, "Legacy cache allow")
    + detachedArrayLength(entry.cosmeticHide, "Legacy cache cosmetic hide")
    + detachedArrayLength(entry.cosmeticAllow, "Legacy cache cosmetic allow");
}

export function rawCacheEntryItemCount(entry) {
  const snapshot = entrySnapshotWithValidPacks(entry);
  return snapshot ? rawCacheEntryItemCountFromSnapshot(snapshot) : 0;
}

export function assertRawCacheEntryWorkBound(entry) {
  const snapshot = entrySnapshotWithValidPacks(entry);
  if (!snapshot) throw new Error("Cache entry must match an exact plain-data cache schema");
  const count = rawCacheEntryItemCountFromSnapshot(snapshot);
  if (count > MAX_RAW_CACHE_POLICY_ITEMS) {
    throw new Error(`Cache entry contains ${count} raw policy items; decode limit is ${MAX_RAW_CACHE_POLICY_ITEMS}`);
  }
  return count;
}

function normalizedRemoteRules(rules) {
  const deduped = new Map();
  const isArray = inspectArrayKind(rules);
  if (isArray == null) throw new TypeError("Cache network encoder rules array kind is invalid");
  if (!isArray) return EMPTY_POLICY_ARRAY;
  const candidates = snapshotDenseDataArray(rules, "Cache network encoder rules", MAX_RAW_CACHE_POLICY_ITEMS);
  for (const candidate of candidates) {
    try {
      const rule = frozenNetworkRule(assertRemoteRuleSafe(candidate));
      deduped.set(ruleKey(rule), rule);
    } catch {
      // Invalid cached rules are discarded rather than becoming network policy.
    }
  }
  return Object.freeze([...deduped.values()].sort((a, b) => compareCodeUnitText(ruleKey(a), ruleKey(b))));
}

function normalizedRemoteCosmetics(rules) {
  const deduped = new Map();
  const isArray = inspectArrayKind(rules);
  if (isArray == null) throw new TypeError("Cache cosmetic encoder rules array kind is invalid");
  if (!isArray) return EMPTY_POLICY_ARRAY;
  const candidates = snapshotDenseDataArray(rules, "Cache cosmetic encoder rules", MAX_RAW_CACHE_POLICY_ITEMS);
  for (const candidate of candidates) {
    try {
      const rule = normalizeRemoteCosmeticRule(candidate);
      deduped.set(cosmeticRuleKey(rule), rule);
    } catch {
      // Corrupt or newly unsafe cosmetic cache entries fail closed.
    }
  }
  return Object.freeze([...deduped.values()].sort((a, b) => compareCodeUnitText(cosmeticRuleKey(a), cosmeticRuleKey(b))));
}

function normalizeCacheSourceKey(value) {
  if (typeof value !== "string" || value.length < 10) return null;
  const separator = value.indexOf("\u0000");
  if (separator <= 0 || separator !== value.lastIndexOf("\u0000")) return null;
  const format = value.slice(0, separator);
  if (!CACHE_SOURCE_FORMATS.has(format)) return null;

  const rawSourceUrl = value.slice(separator + 1);
  if (!rawSourceUrl || rawSourceUrl.length > MAX_CACHE_SOURCE_URL_INPUT_CHARS) return null;
  let source;
  try { source = new URL(rawSourceUrl); }
  catch { return null; }
  if (source.protocol !== "https:" || source.username || source.password) return null;
  source.hash = "";
  if (source.href.length > MAX_CACHE_SOURCE_URL_CHARS) return null;
  try { assertRemoteRuleSafe({ kind: "url", value: source.href }); }
  catch { return null; }
  return `${format}\u0000${source.href}`;
}

function policyCountsSnapshot(value) {
  const counts = denseArrayOrNull(value, "Cache policy counts", 4);
  if (!counts || counts.length !== 4) return null;
  if (!counts.every((count) => Number.isSafeInteger(count) && count >= 0 && count <= MAX_RAW_CACHE_POLICY_ITEMS)) return null;
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total > MAX_RAW_CACHE_POLICY_ITEMS) return null;
  if (!counts.some((count) => count > 0)) return null;
  return counts;
}

function countsForDecoded(decoded) {
  return [decoded.block.length, decoded.allow.length, decoded.cosmeticHide.length, decoded.cosmeticAllow.length];
}

function countsMatch(recorded, decoded) {
  const counts = policyCountsSnapshot(recorded);
  if (!counts) return false;
  const actual = countsForDecoded(decoded);
  return counts.every((count, index) => count === actual[index]);
}

function encodeEntrySnapshot(parsed) {
  const snapshot = plainDataSnapshot(parsed);
  if (!snapshot || !hasOnlyKeys(snapshot, ENCODE_ENTRY_KEYS)) {
    throw new Error("Parsed list must match the exact plain-data cache encoding schema");
  }
  if (!Object.hasOwn(snapshot, "block") || !Object.hasOwn(snapshot, "allow")) {
    throw new Error("Parsed list must contain block and allow arrays");
  }

  const block = snapshotDenseDataArray(snapshot.block, "Parsed list.block", MAX_RAW_CACHE_POLICY_ITEMS);
  const allow = snapshotDenseDataArray(snapshot.allow, "Parsed list.allow", MAX_RAW_CACHE_POLICY_ITEMS);
  const cosmeticHide = Object.hasOwn(snapshot, "cosmeticHide")
    ? snapshotDenseDataArray(snapshot.cosmeticHide, "Parsed list.cosmeticHide", MAX_RAW_CACHE_POLICY_ITEMS)
    : [];
  const cosmeticAllow = Object.hasOwn(snapshot, "cosmeticAllow")
    ? snapshotDenseDataArray(snapshot.cosmeticAllow, "Parsed list.cosmeticAllow", MAX_RAW_CACHE_POLICY_ITEMS)
    : [];
  const total = block.length + allow.length + cosmeticHide.length + cosmeticAllow.length;
  if (total > MAX_RAW_CACHE_POLICY_ITEMS) {
    throw new Error(`Parsed list contains ${total} raw policy items; cache encode limit is ${MAX_RAW_CACHE_POLICY_ITEMS}`);
  }

  return {
    block,
    allow,
    cosmeticHide,
    cosmeticAllow,
    ...(Object.hasOwn(snapshot, "sourceKey") ? { sourceKey: snapshot.sourceKey } : {})
  };
}

export function encodeRulePack(rules) {
  const buckets = { d: [], u: [], p: [], r: [] };
  for (const rule of normalizedRemoteRules(rules)) {
    const code = KIND_TO_CODE[rule.kind];
    if (!code) continue;
    if (rule.resourceTypes?.length) buckets.r.push([code, rule.value, rule.resourceTypes]);
    else buckets[code].push(rule.value);
  }

  const packed = {};
  for (const code of ["d", "u", "p"]) {
    if (buckets[code].length) packed[code] = buckets[code];
  }
  if (buckets.r.length) packed.r = buckets.r;
  return packed;
}

export function decodeRulePack(pack) {
  const snapshot = rulePackSnapshot(pack);
  if (!snapshot || rulePackItemCount(snapshot) > MAX_RAW_CACHE_POLICY_ITEMS) return EMPTY_POLICY_ARRAY;
  const candidates = [];

  for (const code of ["d", "u", "p"]) {
    const values = snapshot[code];
    if (!values) continue;
    for (const value of values) {
      if (typeof value !== "string") continue;
      candidates.push({ kind: CODE_TO_KIND[code], value });
    }
  }

  if (snapshot.r) {
    for (const tuple of snapshot.r) {
      const tupleSnapshot = denseArrayOrNull(tuple, "Cache resource-scoped rule tuple", 3);
      if (!tupleSnapshot || tupleSnapshot.length !== 3) continue;
      const [code, value, rawResourceTypes] = tupleSnapshot;
      const kind = CODE_TO_KIND[code];
      const resourceTypes = denseArrayOrNull(rawResourceTypes, "Cache rule resourceTypes", MAX_NETWORK_RULE_RESOURCE_TYPES);
      if (!kind || typeof value !== "string" || !resourceTypes) continue;
      candidates.push({ kind, value, resourceTypes });
    }
  }

  return normalizedRemoteRules(candidates);
}

export function encodeCosmeticPack(rules) {
  return normalizedRemoteCosmetics(rules).map((rule) => {
    const domains = rule.domains ?? [];
    const excludedDomains = rule.excludedDomains ?? [];
    return domains.length || excludedDomains.length
      ? [rule.selector, domains, excludedDomains]
      : rule.selector;
  });
}

export function decodeCosmeticPack(pack) {
  const snapshot = cosmeticPackSnapshot(pack, "Cache cosmetic pack");
  if (!snapshot) return EMPTY_POLICY_ARRAY;
  const candidates = [];
  for (const item of snapshot) {
    if (typeof item === "string") {
      candidates.push({ selector: item });
      continue;
    }
    const tuple = denseArrayOrNull(item, "Cache scoped cosmetic tuple", 3);
    if (!tuple || tuple.length !== 3) continue;
    const [selector, rawDomains, rawExcludedDomains] = tuple;
    const domains = denseArrayOrNull(rawDomains, "Cache cosmetic domains", MAX_COSMETIC_DOMAINS);
    const excludedDomains = denseArrayOrNull(rawExcludedDomains, "Cache cosmetic excludedDomains", MAX_COSMETIC_DOMAINS);
    if (typeof selector !== "string" || !domains || !excludedDomains) continue;
    candidates.push({ selector, domains, excludedDomains });
  }
  return normalizedRemoteCosmetics(candidates);
}

export function encodeCacheEntry(parsed, nextRefreshAt) {
  const candidate = encodeEntrySnapshot(parsed);
  const refreshAt = finiteRefreshTime(nextRefreshAt);
  const normalized = {
    block: normalizedRemoteRules(candidate.block),
    allow: normalizedRemoteRules(candidate.allow),
    cosmeticHide: normalizedRemoteCosmetics(candidate.cosmeticHide),
    cosmeticAllow: normalizedRemoteCosmetics(candidate.cosmeticAllow)
  };
  const counts = countsForDecoded(normalized);
  if (!counts.some((count) => count > 0)) throw new Error("Parsed list contains no cacheable policy");
  let sourceKey;
  if (Object.hasOwn(candidate, "sourceKey")) {
    sourceKey = normalizeCacheSourceKey(candidate.sourceKey);
    if (!sourceKey) throw new Error("Cache source identity is invalid");
  }
  const cosmeticHide = encodeCosmeticPack(normalized.cosmeticHide);
  const cosmeticAllow = encodeCosmeticPack(normalized.cosmeticAllow);
  return {
    v: CACHE_ENTRY_VERSION,
    b: encodeRulePack(normalized.block),
    a: encodeRulePack(normalized.allow),
    ...(cosmeticHide.length ? { h: cosmeticHide } : {}),
    ...(cosmeticAllow.length ? { x: cosmeticAllow } : {}),
    c: counts,
    ...(sourceKey ? { s: sourceKey } : {}),
    n: refreshAt
  };
}

function decodedPackedPolicy(entry) {
  return {
    block: decodeRulePack(entry.b),
    allow: decodeRulePack(entry.a),
    cosmeticHide: decodeCosmeticPack(entry.h),
    cosmeticAllow: decodeCosmeticPack(entry.x),
    nextRefreshAt: finiteRefreshTime(entry.n)
  };
}

function decodeV5Entry(entry) {
  const decoded = decodedPackedPolicy(entry);
  if (!countsMatch(entry.c, decoded)) return null;
  let sourceKey;
  if (Object.hasOwn(entry, "s")) {
    sourceKey = normalizeCacheSourceKey(entry.s);
    if (!sourceKey) return null;
  }
  return frozenDecodedPolicy(decoded, sourceKey);
}

function decodeV4Entry(entry) {
  const decoded = decodedPackedPolicy(entry);
  return countsMatch(entry.c, decoded) ? frozenDecodedPolicy(decoded) : null;
}

export function decodeCacheEntry(entry) {
  const snapshot = entrySnapshotWithValidPacks(entry);
  if (!snapshot) return null;
  try { assertRawCacheEntryWorkBound(snapshot); }
  catch { return null; }

  if (snapshot.v === CACHE_ENTRY_VERSION) return decodeV5Entry(snapshot);
  if (snapshot.v === 4) return decodeV4Entry(snapshot);

  if (snapshot.v === 3) {
    return frozenDecodedPolicy(decodedPackedPolicy(snapshot));
  }

  if (snapshot.v === 2) {
    return frozenDecodedPolicy({
      block: decodeRulePack(snapshot.b),
      allow: decodeRulePack(snapshot.a),
      cosmeticHide: EMPTY_POLICY_ARRAY,
      cosmeticAllow: EMPTY_POLICY_ARRAY,
      nextRefreshAt: finiteRefreshTime(snapshot.n)
    });
  }

  const blockKind = inspectArrayKind(snapshot.block);
  const allowKind = inspectArrayKind(snapshot.allow);
  if (blockKind == null || allowKind == null) return null;
  const looksLegacy = blockKind || allowKind || Object.hasOwn(snapshot, "nextRefreshAt");
  if (!looksLegacy) return null;
  return frozenDecodedPolicy({
    block: normalizedRemoteRules(snapshot.block),
    allow: normalizedRemoteRules(snapshot.allow),
    cosmeticHide: normalizedRemoteCosmetics(snapshot.cosmeticHide),
    cosmeticAllow: normalizedRemoteCosmetics(snapshot.cosmeticAllow),
    nextRefreshAt: finiteRefreshTime(snapshot.nextRefreshAt)
  });
}

export function compactCacheEntry(entry) {
  const decoded = decodeCacheEntry(entry);
  if (!decoded) return null;
  try {
    return encodeCacheEntry({
      block: decoded.block,
      allow: decoded.allow,
      cosmeticHide: decoded.cosmeticHide,
      cosmeticAllow: decoded.cosmeticAllow,
      ...(Object.hasOwn(decoded, "sourceKey") ? { sourceKey: decoded.sourceKey } : {})
    }, decoded.nextRefreshAt);
  } catch {
    return null;
  }
}

export function normalizeListCache(cache) {
  let snapshot;
  try { snapshot = snapshotRawListCache(cache); }
  catch { return Object.create(null); }
  const normalized = Object.create(null);
  for (const [id, entry] of Object.entries(snapshot)) {
    const compact = compactCacheEntry(entry);
    if (compact) normalized[id] = compact;
  }
  return normalized;
}

export function cacheNextRefreshAt(entry) {
  const snapshot = entrySnapshotWithValidPacks(entry);
  if (!snapshot || snapshot.v !== CACHE_ENTRY_VERSION) return Number.NaN;
  if (!Object.hasOwn(snapshot, "s") || !normalizeCacheSourceKey(snapshot.s)) return 0;
  const decoded = decodeCacheEntry(snapshot);
  if (!decoded || !Object.hasOwn(decoded, "sourceKey")) return 0;
  return finiteRefreshTime(decoded.nextRefreshAt);
}
