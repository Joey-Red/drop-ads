import { normalizeRule, ruleKey } from "./rules.js";
import { normalizeCosmeticRules } from "./cosmetic-rules.js";
import { normalizeDomainSet } from "./personal-rules.js";
import { BUILT_IN_SUBSCRIPTIONS, normalizeSubscriptions } from "./subscriptions.js";
import { normalizeListCache } from "./cache-codec.js";
import { PERSISTED_STATE_KEYS, snapshotPersistedState } from "./state-limits.js";
import {
  assertListCacheStorageBound,
  assertRawListCacheBound,
  MAX_LIST_CACHE_JSON_DEPTH,
  MAX_LIST_CACHE_JSON_NODES
} from "./cache-storage.js";
import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";

export const STORAGE_KEY = "dropAdsState";
export const LIST_CACHE_KEY = "dropAdsListCache";

const EMPTY_STATE_COLLECTION = Object.freeze([]);
const MAX_STORAGE_COLLABORATOR_PROTOTYPE_DEPTH = 8;

export const DEFAULT_STATE = Object.freeze({
  enabled: true,
  autoSubmitCommunity: false,
  updateIntervalHours: 12,
  cookieMode: "third-party",
  cookieBannerMode: "reject",
  cookieBannerDisabledSites: EMPTY_STATE_COLLECTION,
  cookieAllowSites: EMPTY_STATE_COLLECTION,
  personalBlock: EMPTY_STATE_COLLECTION,
  personalAllow: EMPTY_STATE_COLLECTION,
  personalCosmeticHide: EMPTY_STATE_COLLECTION,
  personalCosmeticAllow: EMPTY_STATE_COLLECTION,
  disabledSites: EMPTY_STATE_COLLECTION,
  subscriptions: BUILT_IN_SUBSCRIPTIONS
});

const COOKIE_MODES = new Set(["off", "third-party", "all"]);
const COOKIE_BANNER_MODES = new Set(["off", "reject"]);

function captureReceiverData(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError(`${label} receiver is unavailable`);
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_STORAGE_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor)) throw new TypeError(`${label} must be a data property`);
      return descriptor.value;
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  throw new TypeError(`${label} is unavailable`);
}

function captureReceiverMethod(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError(`${label} receiver is unavailable`);
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_STORAGE_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") throw new TypeError(`${label} must be a data function`);
      const callback = descriptor.value;
      return (...args) => Reflect.apply(callback, receiver, args);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  throw new TypeError(`${label} is unavailable`);
}

function captureStorageLocal(api) {
  const storage = captureReceiverData(api, "storage", "Storage API namespace");
  const local = captureReceiverData(storage, "local", "Storage local namespace");
  return Object.freeze({
    get: captureReceiverMethod(local, "get", "Storage local.get"),
    set: captureReceiverMethod(local, "set", "Storage local.set")
  });
}

async function storageGet(api, key) { return captureStorageLocal(api).get(key); }
async function storageSet(api, payload) { return captureStorageLocal(api).set(payload); }

function freezeNormalizedNetworkRule(rule) {
  const resourceTypes = rule.resourceTypes ? Object.freeze([...rule.resourceTypes]) : undefined;
  return Object.freeze({ kind: rule.kind, value: rule.value, ...(resourceTypes ? { resourceTypes } : {}) });
}

function cloneDefaultState() {
  return Object.freeze({
    enabled: DEFAULT_STATE.enabled,
    autoSubmitCommunity: DEFAULT_STATE.autoSubmitCommunity,
    updateIntervalHours: DEFAULT_STATE.updateIntervalHours,
    cookieMode: DEFAULT_STATE.cookieMode,
    cookieBannerMode: DEFAULT_STATE.cookieBannerMode,
    cookieBannerDisabledSites: Object.freeze([]),
    cookieAllowSites: Object.freeze([]),
    personalBlock: Object.freeze([]),
    personalAllow: Object.freeze([]),
    personalCosmeticHide: Object.freeze([]),
    personalCosmeticAllow: Object.freeze([]),
    disabledSites: Object.freeze([]),
    subscriptions: normalizeSubscriptions(DEFAULT_STATE.subscriptions)
  });
}

export function createDefaultConfiguredState() { return cloneDefaultState(); }

function storageReadValue(result, key) {
  assertPlainExactObject(result, `Storage read result for ${key}`, [key]);
  const field = readPlainDataField(result, key);
  if (!field.safe) throw new Error(`Storage read result for ${key}.${key} must remain an own enumerable data field when present`);
  return field.present ? field.value : undefined;
}

function normalizeRuleArray(value) {
  if (!Array.isArray(value)) return Object.freeze([]);
  const normalized = new Map();
  for (const candidate of value) {
    try {
      const rule = normalizeRule(candidate);
      normalized.set(ruleKey(rule), freezeNormalizedNetworkRule(rule));
    } catch { }
  }
  return Object.freeze([...normalized.values()]);
}

function normalizeBoolean(value, fallback) { return typeof value === "boolean" ? value : fallback; }
function normalizeHours(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 168 ? value : DEFAULT_STATE.updateIntervalHours;
}
function normalizeCookieMode(value) { return typeof value === "string" && COOKIE_MODES.has(value) ? value : DEFAULT_STATE.cookieMode; }
function normalizeCookieBannerMode(value) { return typeof value === "string" && COOKIE_BANNER_MODES.has(value) ? value : DEFAULT_STATE.cookieBannerMode; }

export function normalizePersistedState(stored) {
  const source = snapshotPersistedState(stored);
  return Object.freeze({
    enabled: normalizeBoolean(source.enabled, DEFAULT_STATE.enabled),
    autoSubmitCommunity: normalizeBoolean(source.autoSubmitCommunity, DEFAULT_STATE.autoSubmitCommunity),
    updateIntervalHours: normalizeHours(source.updateIntervalHours),
    cookieMode: normalizeCookieMode(source.cookieMode),
    cookieBannerMode: normalizeCookieBannerMode(source.cookieBannerMode),
    cookieBannerDisabledSites: Object.freeze(normalizeDomainSet(source.cookieBannerDisabledSites)),
    personalBlock: normalizeRuleArray(source.personalBlock),
    personalAllow: normalizeRuleArray(source.personalAllow),
    personalCosmeticHide: Object.freeze(normalizeCosmeticRules(source.personalCosmeticHide)),
    personalCosmeticAllow: Object.freeze(normalizeCosmeticRules(source.personalCosmeticAllow)),
    disabledSites: Object.freeze(normalizeDomainSet(source.disabledSites)),
    cookieAllowSites: Object.freeze(normalizeDomainSet(source.cookieAllowSites)),
    subscriptions: normalizeSubscriptions(source.subscriptions)
  });
}

function writablePersistedStateSnapshot(state) {
  const snapshot = snapshotPersistedState(state);
  for (const key of PERSISTED_STATE_KEYS) if (!Object.hasOwn(snapshot, key)) throw new Error(`Persisted state write is missing field: ${key}`);
  if (typeof snapshot.enabled !== "boolean") throw new Error("Persisted state enabled must be boolean");
  if (typeof snapshot.autoSubmitCommunity !== "boolean") throw new Error("Persisted state autoSubmitCommunity must be boolean");
  if (typeof snapshot.updateIntervalHours !== "number" || !Number.isFinite(snapshot.updateIntervalHours) || snapshot.updateIntervalHours < 1 || snapshot.updateIntervalHours > 168) {
    throw new Error("Persisted state updateIntervalHours must be a finite number from 1 through 168");
  }
  if (!COOKIE_MODES.has(snapshot.cookieMode)) throw new Error("Persisted state cookieMode is invalid");
  if (!COOKIE_BANNER_MODES.has(snapshot.cookieBannerMode)) throw new Error("Persisted state cookieBannerMode is invalid");
  return normalizePersistedState(snapshot);
}

export function assertWritablePersistedState(state) { writablePersistedStateSnapshot(state); return state; }

export async function loadState(api) {
  const result = await storageGet(api, STORAGE_KEY);
  const stored = storageReadValue(result, STORAGE_KEY);
  if (stored === undefined) return cloneDefaultState();
  return normalizePersistedState(stored);
}

export async function saveState(api, state) {
  const snapshot = writablePersistedStateSnapshot(state);
  await storageSet(api, { [STORAGE_KEY]: snapshot });
}

function freezeNormalizedCacheSnapshot(value, state = { nodes: 0 }, depth = 0) {
  if (value === null || typeof value !== "object") return value;
  state.nodes += 1;
  if (state.nodes > MAX_LIST_CACHE_JSON_NODES) throw new Error("Normalized list cache exceeds the freeze work limit");
  if (depth > MAX_LIST_CACHE_JSON_DEPTH) throw new Error("Normalized list cache exceeds the freeze depth limit");
  let isArray;
  let keys;
  try { isArray = Array.isArray(value); keys = Reflect.ownKeys(value); }
  catch { throw new TypeError("Normalized list cache is not safely inspectable"); }
  if (keys.some((key) => typeof key === "symbol")) throw new TypeError("Normalized list cache cannot contain symbol fields");
  for (const key of keys) {
    if (isArray && key === "length") continue;
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
    catch { throw new TypeError("Normalized list cache field is not safely inspectable"); }
    if (!descriptor?.enumerable || !("value" in descriptor)) throw new TypeError("Normalized list cache must contain enumerable data fields only");
    freezeNormalizedCacheSnapshot(descriptor.value, state, depth + 1);
  }
  return Object.freeze(value);
}

function normalizeBoundedCache(cache) {
  const candidate = cache === undefined ? Object.create(null) : cache;
  if (candidate === null) throw new TypeError("Persisted list cache must be an object when present");
  const bounded = assertRawListCacheBound(candidate);
  const normalized = normalizeListCache(bounded);
  assertListCacheStorageBound(normalized);
  return freezeNormalizedCacheSnapshot(normalized);
}

export async function loadListCache(api) {
  const result = await storageGet(api, LIST_CACHE_KEY);
  return normalizeBoundedCache(storageReadValue(result, LIST_CACHE_KEY));
}
export async function saveListCache(api, cache) {
  const normalized = normalizeBoundedCache(cache);
  await storageSet(api, { [LIST_CACHE_KEY]: normalized });
}
export async function saveStateAndListCache(api, state, cache) {
  const stateSnapshot = writablePersistedStateSnapshot(state);
  const normalizedCache = normalizeBoundedCache(cache);
  await storageSet(api, { [STORAGE_KEY]: stateSnapshot, [LIST_CACHE_KEY]: normalizedCache });
}

export async function initializeState(api) {
  const existing = await storageGet(api, STORAGE_KEY);
  const stored = storageReadValue(existing, STORAGE_KEY);
  if (stored !== undefined) {
    const normalized = normalizePersistedState(stored);
    await saveState(api, normalized);
    return normalized;
  }
  const initial = cloneDefaultState();
  await saveState(api, initial);
  return initial;
}
