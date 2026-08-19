import { cosmeticRuleKey, compileTieredCosmeticSelectors, cosmeticStylesheet, normalizeCosmeticRule, normalizeCosmeticRules, parseCosmeticRuleKey } from "./cosmetic-rules.js";
import { isLocalOrPrivatePageHostname } from "./cosmetic-lists.js";
import { MAX_NETWORK_RULE_VALUE_CHARS, normalizeDomain } from "./rules.js";
import { loadListCache, loadState, saveState, LIST_CACHE_KEY, STORAGE_KEY } from "./storage.js";
import { loadSessionState, SESSION_STORAGE_KEY } from "./session.js";
import { mergeCachedCosmeticRules } from "./subscriptions.js";
import { sendTabMessageBatched } from "./tab-fanout.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { LIVE_STATE_LIMITS } from "./state-limits.js";

export const MAX_COSMETIC_RUNTIME_ERROR_CHARS = 1_024;

const COSMETIC_FIELDS = new Set(["personalCosmeticHide", "personalCosmeticAllow"]);
const COSMETIC_RUNTIME_OPTION_KEYS = new Set(["api", "logger"]);
const COSMETIC_POLICY_INPUT_KEYS = new Set(["hostname", "state", "session", "cache"]);
const COSMETIC_GET_MESSAGE_KEYS = new Set(["type"]);
const COSMETIC_ADD_MESSAGE_KEYS = new Set(["type", "field", "rule"]);
const COSMETIC_REMOVE_MESSAGE_KEYS = new Set(["type", "field", "key"]);
const INSTALLATIONS = new WeakMap();
const MAX_EVENT_PROTOTYPE_DEPTH = 8;

function exactDataSnapshot(value, label, allowedKeys) {
  assertPlainExactObject(value, label, allowedKeys);
  const result = Object.create(null);
  for (const key of allowedKeys) {
    const field = readPlainDataField(value, key);
    if (!field.safe) throw new Error(`${label}.${key} must remain an own enumerable data field when present`);
    if (field.present) result[key] = field.value;
  }
  return result;
}

function messageDataFields(value, requiredKeys, allowedKeys) {
  let result;
  try { result = exactDataSnapshot(value, "Cosmetic runtime message", allowedKeys); }
  catch { return null; }
  for (const key of requiredKeys) if (!Object.hasOwn(result, key)) return null;
  return result;
}

function requiredSafeField(container, key, label) {
  const field = readPlainDataField(container, key);
  if (!field.safe) throw new Error(`${label}.${key} must be an own enumerable data field when present`);
  return field;
}

function cosmeticRuntimeFailureMessage(error, fallback) {
  if (typeof fallback !== "string" || !fallback || fallback.length > MAX_COSMETIC_RUNTIME_ERROR_CHARS) {
    throw new TypeError(`Cosmetic runtime error fallback must be a non-empty string of at most ${MAX_COSMETIC_RUNTIME_ERROR_CHARS} characters`);
  }
  if (!error || (typeof error !== "object" && typeof error !== "function")) return fallback;
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(error, "message");
  } catch {
    return fallback;
  }
  if (!descriptor || !("value" in descriptor)) return fallback;
  return typeof descriptor.value === "string"
    && descriptor.value.length > 0
    && descriptor.value.length <= MAX_COSMETIC_RUNTIME_ERROR_CHARS
    ? descriptor.value
    : fallback;
}

function captureWarn(logger) {
  if (logger === undefined) {
    return (...args) => console.warn(...args);
  }
  const warnField = readPlainDataField(logger, "warn");
  if (!warnField.safe || !warnField.present || typeof warnField.value !== "function") {
    throw new TypeError("Cosmetic runtime logger must provide warn() as an own enumerable data field");
  }
  const warnFunction = warnField.value;
  return (...args) => Reflect.apply(warnFunction, logger, args);
}

function warnBestEffort(warn, ...args) {
  try { warn(...args); } catch { /* optional diagnostics must not alter cosmetic runtime control flow */ }
}

function captureDataValue(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_EVENT_PROTOTYPE_DEPTH; depth += 1) {
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

function captureEventMethod(event, key, label, required = true) {
  if (!event || (typeof event !== "object" && typeof event !== "function")) {
    if (!required) return null;
    throw new TypeError(`${label} is unavailable`);
  }
  let current = event;
  for (let depth = 0; current && depth <= MAX_EVENT_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        if (!required && "value" in descriptor && descriptor.value == null) return null;
        throw new TypeError(`${label} must be a data function`);
      }
      const callback = descriptor.value;
      return (...args) => Reflect.apply(callback, event, args);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

function captureListenerEvent(event, label) {
  return Object.freeze({
    add: captureEventMethod(event, "addListener", `${label}.addListener`),
    remove: captureEventMethod(event, "removeListener", `${label}.removeListener`, false)
  });
}

function removeListenerBestEffort(removeListener, listener) {
  if (!removeListener) return;
  try { removeListener(listener); } catch { /* teardown remains failure-isolated */ }
}

function sendResponseBestEffort(sendResponse, payload) {
  if (typeof sendResponse !== "function") return false;
  try {
    sendResponse(payload);
    return true;
  } catch {
    return false;
  }
}

function cosmeticStateSnapshot(state) {
  if (state == null) return null;
  const enabled = requiredSafeField(state, "enabled", "Cosmetic policy state");
  const disabledSites = requiredSafeField(state, "disabledSites", "Cosmetic policy state");
  const subscriptions = requiredSafeField(state, "subscriptions", "Cosmetic policy state");
  const personalCosmeticHide = requiredSafeField(state, "personalCosmeticHide", "Cosmetic policy state");
  const personalCosmeticAllow = requiredSafeField(state, "personalCosmeticAllow", "Cosmetic policy state");
  if (enabled.present && typeof enabled.value !== "boolean") throw new TypeError("Cosmetic policy state.enabled must be boolean");
  return {
    enabled: enabled.present ? enabled.value : false,
    disabledSites: disabledSites.present
      ? snapshotDenseDataArray(disabledSites.value, "Cosmetic policy state.disabledSites", LIVE_STATE_LIMITS.domains)
      : [],
    subscriptions: subscriptions.present ? subscriptions.value : undefined,
    personalCosmeticHide: personalCosmeticHide.present ? personalCosmeticHide.value : undefined,
    personalCosmeticAllow: personalCosmeticAllow.present ? personalCosmeticAllow.value : undefined
  };
}

function cosmeticSessionSnapshot(session) {
  if (session == null) return { disabledSites: [] };
  const disabledSites = requiredSafeField(session, "disabledSites", "Cosmetic policy session");
  return {
    disabledSites: disabledSites.present
      ? snapshotDenseDataArray(disabledSites.value, "Cosmetic policy session.disabledSites", LIVE_STATE_LIMITS.domains)
      : []
  };
}

export function createCosmeticInputCache(loadInputs) {
  if (typeof loadInputs !== "function") throw new TypeError("Cosmetic input loader must be a function");
  let snapshotPromise = null;

  function get() {
    if (snapshotPromise) return snapshotPromise;
    const operation = Promise.resolve().then(loadInputs);
    snapshotPromise = operation.catch((error) => {
      if (snapshotPromise === operation || snapshotPromise === wrapped) snapshotPromise = null;
      throw error;
    });
    const wrapped = snapshotPromise;
    return snapshotPromise;
  }

  function invalidate() {
    snapshotPromise = null;
  }

  return Object.freeze({ get, invalidate });
}

function hostMatchesDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function pageHostname(sender) {
  const direct = readPlainDataField(sender, "url");
  if (!direct.safe) throw new Error("Cosmetic policy sender is invalid");
  let url = direct.present ? direct.value : undefined;
  if (!direct.present) {
    const tabField = readPlainDataField(sender, "tab");
    if (!tabField.safe || !tabField.present) throw new Error("Cosmetic policy sender is invalid");
    const tabUrl = readPlainDataField(tabField.value, "url");
    if (!tabUrl.safe || !tabUrl.present) throw new Error("Cosmetic policy sender is invalid");
    url = tabUrl.value;
  }
  if (typeof url !== "string" || url.length > MAX_NETWORK_RULE_VALUE_CHARS || !/^https?:\/\//i.test(url)) {
    throw new Error("Cosmetic policy is available only to bounded HTTP(S) pages");
  }
  return normalizeDomain(new URL(url).hostname);
}

function siteIsDisabled(hostname, sites) {
  return sites.some((domain) => {
    try { return hostMatchesDomain(hostname, normalizeDomain(domain)); }
    catch { return false; }
  });
}

function cosmeticPolicyResult(enabled, selectors = []) {
  if (!enabled) return Object.freeze({ enabled: false, selectorCount: 0, stylesheet: "" });
  return Object.freeze({
    enabled: true,
    selectorCount: selectors.length,
    stylesheet: cosmeticStylesheet(selectors)
  });
}

export function buildCosmeticPolicy(options = {}) {
  const snapshot = exactDataSnapshot(options, "Cosmetic policy build input", COSMETIC_POLICY_INPUT_KEYS);
  const hostname = snapshot.hostname;
  const state = cosmeticStateSnapshot(snapshot.state);
  const session = cosmeticSessionSnapshot(snapshot.session);
  const cache = snapshot.cache;

  const host = normalizeDomain(hostname);
  if (!state?.enabled || siteIsDisabled(host, state.disabledSites) || siteIsDisabled(host, session.disabledSites)) {
    return cosmeticPolicyResult(false);
  }

  const shared = isLocalOrPrivatePageHostname(host) ? { hide: [], allow: [] } : mergeCachedCosmeticRules(state.subscriptions, cache);
  const selectors = compileTieredCosmeticSelectors({
    hostname: host,
    sharedHide: shared.hide,
    sharedAllow: shared.allow,
    personalHide: normalizeCosmeticRules(state.personalCosmeticHide),
    personalAllow: normalizeCosmeticRules(state.personalCosmeticAllow)
  });
  return cosmeticPolicyResult(true, selectors);
}

export function installCosmeticRuntime(options = {}) {
  const snapshot = exactDataSnapshot(options, "Cosmetic runtime options", COSMETIC_RUNTIME_OPTION_KEYS);
  const api = snapshot.api;
  const existing = INSTALLATIONS.get(api);
  if (existing) return existing;

  const warn = captureWarn(Object.hasOwn(snapshot, "logger") ? snapshot.logger : undefined);
  const runtimeNamespace = captureDataValue(api, "runtime", "Cosmetic runtime runtime namespace");
  const storageNamespace = captureDataValue(api, "storage", "Cosmetic runtime storage namespace");
  const tabsNamespace = captureDataValue(api, "tabs", "Cosmetic runtime tabs namespace");
  const runtimeMessageEvent = captureDataValue(runtimeNamespace, "onMessage", "Cosmetic runtime message event");
  const storageChangedEvent = captureDataValue(storageNamespace, "onChanged", "Cosmetic storage change event");
  const queryTabs = captureEventMethod(tabsNamespace, "query", "Cosmetic runtime tabs.query");
  const runtimeMessageListeners = captureListenerEvent(runtimeMessageEvent, "Cosmetic runtime message event");
  const storageChangedListeners = captureListenerEvent(storageChangedEvent, "Cosmetic storage change event");

  let active = true;
  let queue = Promise.resolve();
  let refreshQueued = false;
  let refreshDirty = false;

  function assertActive() {
    if (!active) throw new Error("Cosmetic runtime is disposed");
  }

  const inputCache = createCosmeticInputCache(async () => {
    const [state, session, cache] = await Promise.all([loadState(api), loadSessionState(api), loadListCache(api)]);
    assertActive();
    return { state, session, cache };
  });

  function enqueue(task) {
    if (!active) return Promise.reject(new Error("Cosmetic runtime is disposed"));
    const run = () => {
      assertActive();
      return task();
    };
    const operation = queue.then(run, run);
    queue = operation.catch(() => undefined);
    return operation;
  }

  async function currentPolicy(sender) {
    const hostname = pageHostname(sender);
    const { state, session, cache } = await inputCache.get();
    assertActive();
    return buildCosmeticPolicy({ hostname, state, session, cache });
  }

  async function addRule(field, candidate) {
    if (!COSMETIC_FIELDS.has(field)) throw new Error("Cosmetic rule field is invalid");
    const normalized = normalizeCosmeticRule(candidate);
    const state = await loadState(api);
    assertActive();
    const existingRules = normalizeCosmeticRules(state[field]);
    if (existingRules.some((rule) => cosmeticRuleKey(rule) === cosmeticRuleKey(normalized))) return { changed: false, rule: normalized };
    const candidateState = { ...state, [field]: normalizeCosmeticRules([...existingRules, normalized]) };
    assertActive();
    await saveState(api, candidateState);
    assertActive();
    inputCache.invalidate();
    return { changed: true, rule: normalized };
  }

  async function removeRule(field, key) {
    if (!COSMETIC_FIELDS.has(field)) throw new Error("Cosmetic rule field is invalid");
    const canonicalKey = cosmeticRuleKey(parseCosmeticRuleKey(key));
    const state = await loadState(api);
    assertActive();
    const current = normalizeCosmeticRules(state[field]);
    const next = current.filter((rule) => cosmeticRuleKey(rule) !== canonicalKey);
    if (next.length === current.length) return { changed: false };
    const candidateState = { ...state, [field]: next };
    assertActive();
    await saveState(api, candidateState);
    assertActive();
    inputCache.invalidate();
    return { changed: true };
  }

  async function broadcastRefresh() {
    let tabs = [];
    try {
      tabs = await queryTabs({});
      assertActive();
    } catch (error) {
      if (!active) throw error;
      warnBestEffort(warn, "drop-ads could not enumerate tabs for cosmetic refresh", error);
      return Object.freeze({ attempted: 0, failed: 0 });
    }
    assertActive();
    const result = await sendTabMessageBatched(api, tabs, { type: "drop-ads:cosmetic-refresh" });
    assertActive();
    return result;
  }

  function scheduleRefresh() {
    if (!active) return;
    refreshDirty = true;
    if (refreshQueued) return;
    refreshQueued = true;
    void enqueue(async () => {
      try {
        do {
          refreshDirty = false;
          await broadcastRefresh();
          assertActive();
        } while (refreshDirty);
      } finally {
        refreshQueued = false;
      }
    }).catch((error) => {
      const needsFollowUp = active && refreshDirty;
      refreshQueued = false;
      if (active) warnBestEffort(warn, "drop-ads cosmetic refresh broadcast failed", error);
      if (needsFollowUp) scheduleRefresh();
    });
  }

  const onMessage = (message, sender, sendResponse) => {
    if (!active) return false;
    const typeField = readPlainDataField(message, "type");
    if (!typeField.safe || !typeField.present || typeof typeField.value !== "string") return false;
    const type = typeField.value;
    if (type === "drop-ads:get-cosmetic-policy") {
      if (!messageDataFields(message, ["type"], COSMETIC_GET_MESSAGE_KEYS)) return false;
      void enqueue(() => currentPolicy(sender))
        .then((policy) => { if (active) sendResponseBestEffort(sendResponse, { ok: true, policy }); })
        .catch((error) => { if (active) sendResponseBestEffort(sendResponse, { ok: false, error: cosmeticRuntimeFailureMessage(error, "Could not read cosmetic policy") }); });
      return true;
    }
    if (type === "drop-ads:add-cosmetic-rule") {
      const fields = messageDataFields(message, ["type", "field", "rule"], COSMETIC_ADD_MESSAGE_KEYS);
      if (!fields) return false;
      void enqueue(() => addRule(fields.field, fields.rule))
        .then((result) => { if (active) sendResponseBestEffort(sendResponse, { ok: true, result }); })
        .catch((error) => { if (active) sendResponseBestEffort(sendResponse, { ok: false, error: cosmeticRuntimeFailureMessage(error, "Could not add cosmetic rule") }); });
      return true;
    }
    if (type === "drop-ads:remove-cosmetic-rule") {
      const fields = messageDataFields(message, ["type", "field", "key"], COSMETIC_REMOVE_MESSAGE_KEYS);
      if (!fields) return false;
      void enqueue(() => removeRule(fields.field, fields.key))
        .then((result) => { if (active) sendResponseBestEffort(sendResponse, { ok: true, result }); })
        .catch((error) => { if (active) sendResponseBestEffort(sendResponse, { ok: false, error: cosmeticRuntimeFailureMessage(error, "Could not remove cosmetic rule") }); });
      return true;
    }
    return false;
  };

  const onStorageChanged = (changes, areaName) => {
    if (!active) return;
    let relevant = false;
    if (areaName === "local") {
      const stateChange = readPlainDataField(changes, STORAGE_KEY);
      const cacheChange = readPlainDataField(changes, LIST_CACHE_KEY);
      if (!stateChange.safe || !cacheChange.safe) return;
      relevant = stateChange.present || cacheChange.present;
    } else if (areaName === "session") {
      const sessionChange = readPlainDataField(changes, SESSION_STORAGE_KEY);
      if (!sessionChange.safe) return;
      relevant = sessionChange.present;
    }
    if (!relevant) return;
    inputCache.invalidate();
    scheduleRefresh();
  };

  let messageListenerRegistered = false;
  let storageListenerAttempted = false;
  try {
    runtimeMessageListeners.add(onMessage);
    messageListenerRegistered = true;
    storageListenerAttempted = true;
    storageChangedListeners.add(onStorageChanged);
  } catch (error) {
    active = false;
    inputCache.invalidate();
    if (storageListenerAttempted) removeListenerBestEffort(storageChangedListeners.remove, onStorageChanged);
    if (messageListenerRegistered) removeListenerBestEffort(runtimeMessageListeners.remove, onMessage);
    throw error;
  }

  const runtime = Object.freeze({
    currentPolicy: (sender) => enqueue(() => currentPolicy(sender)),
    addRule: (...args) => enqueue(() => addRule(...args)),
    removeRule: (...args) => enqueue(() => removeRule(...args)),
    broadcastRefresh: () => enqueue(broadcastRefresh),
    invalidatePolicyInputs: () => { assertActive(); inputCache.invalidate(); },
    whenIdle: async () => { await queue; await queue; },
    dispose() {
      if (!active) return;
      active = false;
      refreshDirty = false;
      inputCache.invalidate();
      try {
        removeListenerBestEffort(runtimeMessageListeners.remove, onMessage);
        removeListenerBestEffort(storageChangedListeners.remove, onStorageChanged);
      } finally {
        if (INSTALLATIONS.get(api) === runtime) INSTALLATIONS.delete(api);
      }
    }
  });
  INSTALLATIONS.set(api, runtime);
  return runtime;
}
