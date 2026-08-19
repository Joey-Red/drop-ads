import { compileManagedRules, isManagedRuleId, normalizeDomain, normalizeHttpUrl, ruleKey } from "./rules.js";
import { addUniqueRule, normalizeDomainSet, removeRule, setDomainFlag, setSiteDisabled } from "./personal-rules.js";
import { buildCommunityIssueUrl, isCommunityCandidateEligible } from "./community.js";
import { parseList, validateListMetadata } from "./lists.js";
import { downloadAndParseSubscription, isRefreshDue, makeCacheEntry } from "./list-updates.js";
import { DEFAULT_COMMUNITY_SUBSCRIPTION, mergeCachedRules, normalizeSubscription, pruneListCache, subscriptionSourceKey } from "./subscriptions.js";
import { parseSettingsBackup } from "./settings-backup.js";
import { initializeState, loadListCache, loadState, saveListCache, saveState, saveStateAndListCache, STORAGE_KEY } from "./storage.js";
import { loadSessionState, saveSessionState, SESSION_STORAGE_KEY } from "./session.js";
import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";

export const MENU_BLOCK_DEFAULT = "drop-ads:block-default";
export const MENU_PARENT = "drop-ads:block";
export const MENU_BLOCK_EXACT = "drop-ads:block-exact";
export const MENU_BLOCK_DOMAIN = "drop-ads:block-domain";
export const LIST_REFRESH_ALARM = "drop-ads:list-refresh";
export const MAX_BACKGROUND_RUNTIME_ERROR_CHARS = 1_024;

const BLOCKABLE_CONTEXTS = Object.freeze(["image", "video", "audio", "frame", "link"]);
const PERSONAL_RULE_FIELDS = new Set(["personalBlock", "personalAllow"]);
const COOKIE_MODES = new Set(["off", "third-party", "all"]);
const RUNTIME_OPTION_KEYS = new Set(["api", "fetchImpl", "now", "logger"]);
const RUNTIME_INITIALIZE_OPTION_KEYS = new Set(["repairState"]);
const EXTERNAL_SUBSCRIPTION_KEYS = new Set(["id", "title", "format", "sourceUrl", "enabled"]);
const REQUIRED_EXTERNAL_SUBSCRIPTION_KEYS = ["id", "title", "format", "sourceUrl"];
const POLICY_SNAPSHOT_LIMITS = Object.freeze({ depth: 16, objectFields: 64, arrayEntries: 10_000, values: 250_000 });
const MANAGED_RULE_SNAPSHOT_LIMITS = Object.freeze({ depth: 16, objectFields: 64, arrayEntries: 10_000, values: 50_000 });
const CACHE_FINGERPRINT_SNAPSHOT_LIMITS = Object.freeze({ depth: 32, objectFields: 512, arrayEntries: 300_000, values: 1_000_000 });
const MAX_DYNAMIC_RULE_RESULT_ENTRIES = 100_000;
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function optionValue(options, key) {
  return Object.hasOwn(options, key) ? Object.getOwnPropertyDescriptor(options, key).value : undefined;
}

function runtimeOptionsSnapshot(options) {
  assertPlainExactObject(options, "Background runtime options", RUNTIME_OPTION_KEYS);
  const snapshot = Object.create(null);
  for (const key of RUNTIME_OPTION_KEYS) {
    const field = readPlainDataField(options, key);
    if (!field.safe) throw new TypeError(`Background runtime option ${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  return Object.freeze(snapshot);
}

function bestEffortBoundLogger(callback, receiver) {
  const bound = callback.bind(receiver);
  return (...args) => {
    try { return bound(...args); }
    catch { return undefined; }
  };
}

function captureRuntimeLogger(options) {
  if (!Object.hasOwn(options, "logger")) {
    return Object.freeze({
      warn: bestEffortBoundLogger(console.warn, console),
      error: bestEffortBoundLogger(console.error, console)
    });
  }
  const logger = optionValue(options, "logger");
  const warnField = readPlainDataField(logger, "warn");
  const errorField = readPlainDataField(logger, "error");
  if (!warnField.safe || !warnField.present || typeof warnField.value !== "function"
    || !errorField.safe || !errorField.present || typeof errorField.value !== "function") {
    throw new TypeError("Background runtime logger must provide own enumerable data warn() and error() functions");
  }
  return Object.freeze({
    warn: bestEffortBoundLogger(warnField.value, logger),
    error: bestEffortBoundLogger(errorField.value, logger)
  });
}

function requireApi(api) {
  const required = ["runtime", "storage", "declarativeNetRequest", "contextMenus", "alarms", "tabs"];
  for (const key of required) {
    if (!api?.[key]) throw new Error(`WebExtension API is missing ${key}`);
  }
  return api;
}

function captureBoundMethod(receiver, key, label, required = true) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    if (!required) return null;
    throw new TypeError(`${label} receiver is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH && current; depth += 1) {
    let descriptor;
    let prototype;
    try {
      descriptor = Object.getOwnPropertyDescriptor(current, key);
      prototype = Object.getPrototypeOf(current);
    } catch {
      throw new TypeError(`${label} is not safely inspectable`);
    }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        throw new TypeError(`${label} must be a data function`);
      }
      return (...args) => Reflect.apply(descriptor.value, receiver, args);
    }
    current = prototype;
  }
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

function captureEventCollaborators(event, label) {
  return Object.freeze({
    add: captureBoundMethod(event, "addListener", `${label}.addListener`),
    remove: captureBoundMethod(event, "removeListener", `${label}.removeListener`, false)
  });
}

function ownDataField(value, key) {
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { return { present: false, safe: false, value: undefined }; }
  if (!value || typeof value !== "object" || isArray) return { present: false, safe: false, value: undefined };
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
  catch { return { present: false, safe: false, value: undefined }; }
  if (!descriptor) return { present: false, safe: true, value: undefined };
  if (!descriptor.enumerable || !("value" in descriptor)) return { present: true, safe: false, value: undefined };
  return { present: true, safe: true, value: descriptor.value };
}

function backgroundCaughtErrorMessage(error, fallback) {
  if (typeof fallback !== "string" || !fallback || fallback.length > MAX_BACKGROUND_RUNTIME_ERROR_CHARS) {
    throw new TypeError("Background runtime error fallback is invalid");
  }
  let isArray;
  let descriptor;
  try {
    isArray = Array.isArray(error);
    descriptor = error && typeof error === "object" && !isArray
      ? Object.getOwnPropertyDescriptor(error, "message")
      : null;
  } catch {
    return fallback;
  }
  if (descriptor && "value" in descriptor && typeof descriptor.value === "string"
    && descriptor.value.length > 0 && descriptor.value.length <= MAX_BACKGROUND_RUNTIME_ERROR_CHARS) {
    return descriptor.value;
  }
  return fallback;
}

function boundedImportActivationError(error, title) {
  const fallback = "source unavailable";
  const prefix = `Could not activate imported filter list ${title}: `;
  const detail = backgroundCaughtErrorMessage(error, fallback);
  const room = Math.max(0, MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix.length);
  const boundedDetail = detail.length <= room ? detail : fallback.slice(0, room);
  return `${prefix}${boundedDetail}`;
}

function sendResponseBestEffort(sendResponse, payload) {
  try { sendResponse(payload); } catch { /* response channels may close before asynchronous completion */ }
}

function eventFields(value, requiredKeys = [], optionalKeys = []) {
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { return null; }
  if (!value || typeof value !== "object" || isArray) return null;
  const result = Object.create(null);
  for (const key of requiredKeys) {
    const field = ownDataField(value, key);
    if (!field.safe || !field.present) return null;
    result[key] = field.value;
  }
  for (const key of optionalKeys) {
    const field = ownDataField(value, key);
    if (!field.safe) return null;
    if (field.present) result[key] = field.value;
  }
  return result;
}

function externalSubscriptionSnapshot(subscription) {
  assertPlainExactObject(subscription, "External subscription", EXTERNAL_SUBSCRIPTION_KEYS);
  const snapshot = Object.create(null);
  for (const key of EXTERNAL_SUBSCRIPTION_KEYS) {
    const field = readPlainDataField(subscription, key);
    if (!field.safe) throw new Error(`External subscription ${key} must be an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  for (const key of REQUIRED_EXTERNAL_SUBSCRIPTION_KEYS) {
    if (!Object.hasOwn(snapshot, key)) throw new Error(`External subscription is missing field: ${key}`);
  }
  return snapshot;
}

function snapshotDenseDataArray(value, label, maxEntries) {
  let isArray;
  let prototype;
  let keys;
  let lengthDescriptor;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    throw new TypeError(`${label} is invalid`);
  }
  if (!isArray || prototype !== Array.prototype) throw new TypeError(`${label} must be a normal array`);
  if (!lengthDescriptor || !("value" in lengthDescriptor) || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) {
    throw new TypeError(`${label} length is invalid`);
  }
  const length = lengthDescriptor.value;
  if (length > maxEntries) throw new Error(`${label} exceeds the ${maxEntries}-entry limit`);
  if (keys.length !== length + 1) throw new TypeError(`${label} must be dense and contain no extra properties`);
  const result = new Array(length);
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(value, String(index)); }
    catch { throw new TypeError(`${label} is invalid`); }
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${label} must contain enumerable own data entries`);
    }
    result[index] = descriptor.value;
  }
  return result;
}

function boundedJsonData(value, limits, label, context = null, depth = 0) {
  const state = context ?? { visited: 0, active: new Set() };
  state.visited += 1;
  if (state.visited > limits.values) throw new Error(`${label} exceeds the visited-value limit`);
  if (depth > limits.depth) throw new Error(`${label} exceeds the nesting-depth limit`);
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} contains a non-finite number`);
    return value;
  }
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { throw new TypeError(`${label} is invalid`); }
  if (isArray) {
    if (state.active.has(value)) throw new TypeError(`${label} contains a cycle`);
    const entries = snapshotDenseDataArray(value, label, limits.arrayEntries);
    state.active.add(value);
    try { return entries.map((entry) => boundedJsonData(entry, limits, label, state, depth + 1)); }
    finally { state.active.delete(value); }
  }
  if (!value || typeof value !== "object") throw new TypeError(`${label} contains an unsupported value`);
  let prototype;
  let keys;
  try { prototype = Object.getPrototypeOf(value); keys = Reflect.ownKeys(value); }
  catch { throw new TypeError(`${label} object is invalid`); }
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must contain plain objects`);
  if (keys.length > limits.objectFields) throw new Error(`${label} exceeds the per-object field limit`);
  if (keys.some((key) => typeof key !== "string")) throw new TypeError(`${label} contains symbol fields`);
  if (state.active.has(value)) throw new TypeError(`${label} contains a cycle`);
  state.active.add(value);
  try {
    const result = Object.create(null);
    for (const key of keys.sort()) {
      let descriptor;
      try { descriptor = Object.getOwnPropertyDescriptor(value, key); }
      catch { throw new TypeError(`${label} object is invalid`); }
      if (!descriptor?.enumerable || !("value" in descriptor)) throw new TypeError(`${label} fields must be enumerable own data fields`);
      result[key] = boundedJsonData(descriptor.value, limits, label, state, depth + 1);
    }
    return result;
  } finally { state.active.delete(value); }
}

function safePolicyData(value, context = null) {
  return boundedJsonData(value, POLICY_SNAPSHOT_LIMITS, "Policy event data", context);
}

function policyStateView(value) {
  if (value == null) return null;
  let isArray;
  try { isArray = Array.isArray(value); }
  catch { throw new Error("Unsafe policy event state"); }
  if (typeof value !== "object" || isArray) throw new Error("Unsafe policy event state");
  const fieldNames = ["enabled", "cookieMode", "cookieAllowSites", "personalBlock", "personalAllow", "disabledSites", "subscriptions"];
  const fields = eventFields(value, [], fieldNames);
  if (!fields) throw new Error("Unsafe policy event state");
  const context = { visited: 0, active: new Set() };
  const safeSubscriptions = safePolicyData(fields.subscriptions, context);
  const subscriptions = Array.isArray(safeSubscriptions)
    ? safeSubscriptions.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Unsafe policy event subscription");
      const subscriptionFields = eventFields(item, [], ["id", "enabled"]);
      if (!subscriptionFields) throw new Error("Unsafe policy event subscription");
      return { id: subscriptionFields.id, enabled: subscriptionFields.enabled };
    })
    : safeSubscriptions;
  return {
    enabled: safePolicyData(fields.enabled, context),
    cookieMode: safePolicyData(fields.cookieMode, context),
    cookieAllowSites: safePolicyData(fields.cookieAllowSites, context),
    personalBlock: safePolicyData(fields.personalBlock, context),
    personalAllow: safePolicyData(fields.personalAllow, context),
    disabledSites: safePolicyData(fields.disabledSites, context),
    subscriptions
  };
}

function policyFingerprint(value) { return JSON.stringify(policyStateView(value)); }

function sessionPolicyFingerprint(value) {
  if (value == null) return JSON.stringify([]);
  const fields = eventFields(value, [], ["disabledSites"]);
  if (!fields) throw new Error("Unsafe session policy event state");
  return JSON.stringify(normalizeDomainSet(safePolicyData(fields.disabledSites)));
}

function localPolicyChanged(change) {
  const fields = eventFields(change, [], ["oldValue", "newValue"]);
  if (!fields) return false;
  try { return policyFingerprint(fields.oldValue) !== policyFingerprint(fields.newValue); }
  catch { return false; }
}

function snapshotDynamicRuleEntries(value) {
  const rules = snapshotDenseDataArray(value, "Dynamic rule result", MAX_DYNAMIC_RULE_RESULT_ENTRIES);
  const seenIds = new Set();
  const entries = [];
  for (const rule of rules) {
    let isArray;
    let prototype;
    try { isArray = Array.isArray(rule); prototype = rule && typeof rule === "object" ? Object.getPrototypeOf(rule) : null; }
    catch { throw new TypeError("Dynamic rule entry is invalid"); }
    if (!rule || typeof rule !== "object" || isArray || (prototype !== Object.prototype && prototype !== null)) throw new TypeError("Dynamic rule entry must be a plain object");
    const idField = ownDataField(rule, "id");
    if (!idField.safe || !idField.present || !Number.isSafeInteger(idField.value) || idField.value <= 0) throw new TypeError("Dynamic rule id must be a positive safe integer own data field");
    if (seenIds.has(idField.value)) throw new Error("Dynamic rule result contains duplicate ids");
    seenIds.add(idField.value);
    entries.push(Object.freeze({ id: idField.value, rule }));
  }
  return Object.freeze(entries);
}

function canonicalManagedRule(rule) { return boundedJsonData(rule, MANAGED_RULE_SNAPSHOT_LIMITS, "Managed DNR rule"); }

function managedRuleMap(rules, label) {
  const entries = snapshotDynamicRuleEntries(rules);
  const result = new Map();
  for (const entry of entries) {
    const canonical = canonicalManagedRule(entry.rule);
    result.set(entry.id, Object.freeze({ id: entry.id, rule: canonical, signature: JSON.stringify(canonical) }));
  }
  if (result.size !== entries.length) throw new Error(`${label} contains duplicate rule ids`);
  return result;
}

export function diffManagedRules(currentRules, desiredRules) {
  const currentById = managedRuleMap(currentRules, "Current managed rules");
  const desiredById = managedRuleMap(desiredRules, "Desired managed rules");
  const removeRuleIds = [];
  const addRules = [];
  for (const [id, currentRecord] of currentById) {
    const desiredRecord = desiredById.get(id);
    if (!desiredRecord || currentRecord.signature !== desiredRecord.signature) removeRuleIds.push(id);
  }
  for (const [id, desiredRecord] of desiredById) {
    const currentRecord = currentById.get(id);
    if (!currentRecord || currentRecord.signature !== desiredRecord.signature) addRules.push(desiredRecord.rule);
  }
  removeRuleIds.sort((left, right) => left - right);
  addRules.sort((left, right) => ownDataField(left, "id").value - ownDataField(right, "id").value);
  return { removeRuleIds, addRules };
}

function cacheFingerprint(cache) {
  let isArray;
  try { isArray = Array.isArray(cache); }
  catch { throw new TypeError("List cache fingerprint input is invalid"); }
  if (!cache || typeof cache !== "object" || isArray) return "{}";
  return JSON.stringify(boundedJsonData(cache, CACHE_FINGERPRINT_SNAPSHOT_LIMITS, "List cache fingerprint"));
}

function strictRefreshForce(force = false) {
  if (typeof force !== "boolean") throw new TypeError("List refresh force must be boolean");
  return force;
}

export function createBackgroundRuntime(options = {}) {
  const runtimeOptions = runtimeOptionsSnapshot(options);
  const api = runtimeOptions.api;
  const fetchImpl = Object.hasOwn(runtimeOptions, "fetchImpl") ? runtimeOptions.fetchImpl : fetch;
  const now = Object.hasOwn(runtimeOptions, "now") ? runtimeOptions.now : Date.now;
  const logger = captureRuntimeLogger(runtimeOptions);
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function");
  if (typeof now !== "function") throw new TypeError("now must be a function");
  requireApi(api);

  const alarmClear = captureBoundMethod(api.alarms, "clear", "Background runtime alarms.clear");
  const alarmCreate = captureBoundMethod(api.alarms, "create", "Background runtime alarms.create");
  const events = Object.freeze({
    installed: captureEventCollaborators(api.runtime.onInstalled, "runtime.onInstalled"),
    startup: captureEventCollaborators(api.runtime.onStartup, "runtime.onStartup"),
    contextClicked: captureEventCollaborators(api.contextMenus.onClicked, "contextMenus.onClicked"),
    alarm: captureEventCollaborators(api.alarms.onAlarm, "alarms.onAlarm"),
    message: captureEventCollaborators(api.runtime.onMessage, "runtime.onMessage"),
    storageChanged: captureEventCollaborators(api.storage.onChanged, "storage.onChanged")
  });

  let started = false;
  let disposed = false;
  const listenerRegistrations = [];
  let taskQueue = Promise.resolve();
  let listTaskQueue = Promise.resolve();
  let appliedLocalPolicyFingerprint = null;
  let appliedSessionPolicyFingerprint = null;

  function disposedError() { return new Error("Background runtime has been disposed"); }

  function dynamicRuleLimit() {
    const value = api.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES;
    if (Number.isInteger(value) && value > 0) return value;
    const legacy = api.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
    return Number.isInteger(legacy) && legacy > 0 ? legacy : 5_000;
  }

  async function loadEffectiveState(state, cache, sessionState) {
    const baseState = state ?? await loadState(api);
    const sourceCache = cache ?? await loadListCache(api);
    const shared = mergeCachedRules(baseState.subscriptions, sourceCache);
    const session = sessionState ?? await loadSessionState(api);
    return { ...baseState, communityBlock: shared.block, communityAllow: shared.allow, disabledSites: normalizeDomainSet([...(baseState.disabledSites ?? []), ...(session.disabledSites ?? [])]) };
  }

  async function applyManagedRules(state) {
    const currentEntries = snapshotDynamicRuleEntries(await api.declarativeNetRequest.getDynamicRules());
    const previousManaged = currentEntries.filter((entry) => isManagedRuleId(entry.id)).map((entry) => entry.rule);
    const unmanagedCount = currentEntries.length - previousManaged.length;
    const maxManagedRules = Math.max(0, dynamicRuleLimit() - unmanagedCount);
    const desiredManaged = state.enabled ? compileManagedRules(state, { maxDynamicRules: maxManagedRules }) : [];
    const delta = diffManagedRules(previousManaged, desiredManaged);
    if (!delta.removeRuleIds.length && !delta.addRules.length) return { previousManaged, changed: false };
    await api.declarativeNetRequest.updateDynamicRules(delta);
    return { previousManaged, changed: true };
  }

  async function restoreManagedRules(previousManaged) {
    const currentEntries = snapshotDynamicRuleEntries(await api.declarativeNetRequest.getDynamicRules());
    const currentManaged = currentEntries.filter((entry) => isManagedRuleId(entry.id)).map((entry) => entry.rule);
    const delta = diffManagedRules(currentManaged, previousManaged);
    if (!delta.removeRuleIds.length && !delta.addRules.length) return;
    await api.declarativeNetRequest.updateDynamicRules(delta);
  }

  function appliedPolicySnapshot() { return { local: appliedLocalPolicyFingerprint, session: appliedSessionPolicyFingerprint }; }
  function markAppliedPolicy(state, session) { appliedLocalPolicyFingerprint = policyFingerprint(state); appliedSessionPolicyFingerprint = sessionPolicyFingerprint(session); }
  function restoreAppliedPolicy(snapshot) { appliedLocalPolicyFingerprint = snapshot.local; appliedSessionPolicyFingerprint = snapshot.session; }

  async function activateCandidatePolicy(state, cache, sessionState) {
    const session = sessionState ?? await loadSessionState(api);
    const effectiveCandidateState = await loadEffectiveState(state, cache, session);
    const previousFingerprints = appliedPolicySnapshot();
    const activation = await applyManagedRules(effectiveCandidateState);
    markAppliedPolicy(state, session);
    return { previousFingerprints, previousManaged: activation.previousManaged, dnrChanged: activation.changed };
  }

  async function rollbackCandidatePolicy(transaction, label) {
    try {
      if (transaction.dnrChanged) await restoreManagedRules(transaction.previousManaged);
      restoreAppliedPolicy(transaction.previousFingerprints);
    } catch (rollbackError) {
      appliedLocalPolicyFingerprint = null;
      appliedSessionPolicyFingerprint = null;
      logger.error(`drop-ads failed to restore rules after ${label} persistence failure`, rollbackError);
    }
  }

  async function syncRules() {
    const [state, cache, session] = await Promise.all([loadState(api), loadListCache(api), loadSessionState(api)]);
    const effectiveState = await loadEffectiveState(state, cache, session);
    await applyManagedRules(effectiveState);
    markAppliedPolicy(state, session);
  }

  async function repairRulesIfNeeded() {
    const [state, session] = await Promise.all([loadState(api), loadSessionState(api)]);
    if (policyFingerprint(state) === appliedLocalPolicyFingerprint && sessionPolicyFingerprint(session) === appliedSessionPolicyFingerprint) return false;
    await syncRules();
    return true;
  }

  async function uiStateSnapshot() {
    const [state, session] = await Promise.all([loadState(api), loadSessionState(api)]);
    const currentEntries = snapshotDynamicRuleEntries(await api.declarativeNetRequest.getDynamicRules());
    const managedLoaded = currentEntries.some((entry) => isManagedRuleId(entry.id));
    if ((!state.enabled && managedLoaded) || (state.enabled && !managedLoaded)) {
      const cache = await loadListCache(api);
      await activateCandidatePolicy(state, cache, session);
    }
    return { state, session };
  }

  async function installContextMenus() {
    await api.contextMenus.removeAll();
    api.contextMenus.create({ id: MENU_BLOCK_DEFAULT, title: "Block ad/resource locally", contexts: [...BLOCKABLE_CONTEXTS] });
    api.contextMenus.create({ id: MENU_PARENT, title: "Drop Ads: advanced blocking", contexts: [...BLOCKABLE_CONTEXTS] });
    api.contextMenus.create({ id: MENU_BLOCK_EXACT, parentId: MENU_PARENT, title: "Block exact resource URL locally", contexts: [...BLOCKABLE_CONTEXTS] });
    api.contextMenus.create({ id: MENU_BLOCK_DOMAIN, parentId: MENU_PARENT, title: "Block resource domain locally", contexts: [...BLOCKABLE_CONTEXTS] });
  }

  function queueTask(task) {
    if (disposed) return Promise.reject(disposedError());
    const run = () => {
      if (disposed) throw disposedError();
      return task();
    };
    const operation = taskQueue.then(run, run);
    taskQueue = operation.catch(() => undefined);
    return operation;
  }

  function queueListTask(task) {
    if (disposed) return Promise.reject(disposedError());
    const run = () => {
      if (disposed) throw disposedError();
      return task();
    };
    const operation = listTaskQueue.then(run, run);
    listTaskQueue = operation.catch(() => undefined);
    return operation;
  }

  function queueRuleRepair() { return queueTask(repairRulesIfNeeded); }

  async function openCommunitySubmission(rule) { await api.tabs.create({ url: buildCommunityIssueUrl(rule) }); }

  async function tryAutoCommunitySubmission(rule) {
    if (!isCommunityCandidateEligible(rule)) return "not-eligible";
    try { await openCommunitySubmission(rule); return "prepared"; }
    catch (error) { logger.warn("drop-ads local block succeeded but automatic community submission could not be prepared", error); return "failed"; }
  }

  async function commitPersistentPolicy(candidateState, label) {
    const cache = await loadListCache(api);
    const transaction = await activateCandidatePolicy(candidateState, cache);
    try { await saveState(api, candidateState); }
    catch (error) { await rollbackCandidatePolicy(transaction, label); throw error; }
  }

  async function commitGlobalPreference(previousState, candidateState) {
    const cache = await loadListCache(api);
    // The persisted master preference is the restart source of truth. Write it
    // before the potentially long DNR replacement so an extension reload in
    // the middle of the operation converges to what the user selected instead
    // of reviving the previous checkbox value.
    await saveState(api, candidateState);
    try {
      await activateCandidatePolicy(candidateState, cache);
    } catch (error) {
      try { await saveState(api, previousState); }
      catch (rollbackError) {
        appliedLocalPolicyFingerprint = null;
        appliedSessionPolicyFingerprint = null;
        logger.error("drop-ads failed to restore the master preference after DNR activation failed", rollbackError);
      }
      throw error;
    }
  }

  async function commitSessionPolicy(candidateSession, label) {
    const [state, cache] = await Promise.all([loadState(api), loadListCache(api)]);
    const transaction = await activateCandidatePolicy(state, cache, candidateSession);
    try { await saveSessionState(api, candidateSession); }
    catch (error) { await rollbackCandidatePolicy(transaction, label); throw error; }
  }

  async function setGlobalEnabled(value) {
    if (typeof value !== "boolean") throw new Error("Enabled state must be boolean");
    const state = await loadState(api);
    if (state.enabled === value) {
      const cache = await loadListCache(api);
      const transaction = await activateCandidatePolicy(state, cache);
      return { enabled: value, changed: false, repaired: transaction.dnrChanged };
    }
    const candidateState = { ...state, enabled: value };
    await commitGlobalPreference(state, candidateState);
    return { enabled: value, changed: true, repaired: false };
  }

  async function addPersonalRule(field, candidate) {
    if (!PERSONAL_RULE_FIELDS.has(field)) throw new Error("Personal rule field is invalid");
    const state = await loadState(api);
    const beforeKeys = new Set(state[field].map(ruleKey));
    const nextRules = addUniqueRule(state[field], candidate);
    const normalizedCandidate = nextRules.find((rule) => !beforeKeys.has(ruleKey(rule)));
    if (!normalizedCandidate) return { field, changed: false, rule: null, communitySubmission: "not-requested" };
    const candidateState = { ...state, [field]: nextRules };
    await commitPersistentPolicy(candidateState, `${field} addition`);
    let communitySubmission = "not-requested";
    if (field === "personalBlock" && state.autoSubmitCommunity) communitySubmission = await tryAutoCommunitySubmission(normalizedCandidate);
    return { field, changed: true, rule: normalizedCandidate, communitySubmission };
  }

  async function removePersonalRule(field, key) {
    if (!PERSONAL_RULE_FIELDS.has(field)) throw new Error("Personal rule field is invalid");
    if (typeof key !== "string" || !key) throw new Error("Personal rule key is required");
    const state = await loadState(api);
    const nextRules = removeRule(state[field], key);
    if (nextRules.length === state[field].length) return { field, changed: false };
    const candidateState = { ...state, [field]: nextRules };
    await commitPersistentPolicy(candidateState, `${field} removal`);
    return { field, changed: true };
  }

  async function setCookieMode(value) {
    if (!COOKIE_MODES.has(value)) throw new Error("Cookie mode is invalid");
    const state = await loadState(api);
    if (state.cookieMode === value) return { cookieMode: value, changed: false };
    const candidateState = { ...state, cookieMode: value };
    await commitPersistentPolicy(candidateState, "cookie mode");
    return { cookieMode: value, changed: true };
  }

  async function setCookieException(domain, allowed) {
    if (typeof allowed !== "boolean") throw new Error("Cookie exception state must be boolean");
    const state = await loadState(api);
    const normalizedDomain = normalizeDomain(domain);
    const nextSites = setDomainFlag(state.cookieAllowSites, normalizedDomain, allowed);
    if (JSON.stringify(nextSites) === JSON.stringify(state.cookieAllowSites)) return { domain: normalizedDomain, allowed, changed: false };
    const candidateState = { ...state, cookieAllowSites: nextSites };
    await commitPersistentPolicy(candidateState, "cookie exception");
    return { domain: normalizedDomain, allowed, changed: true };
  }

  async function setPersistentSiteDisabled(domain, disabled) {
    if (typeof disabled !== "boolean") throw new Error("Site disabled state must be boolean");
    const state = await loadState(api);
    const normalizedDomain = normalizeDomain(domain);
    const nextSites = setSiteDisabled(state.disabledSites, normalizedDomain, disabled);
    if (JSON.stringify(nextSites) === JSON.stringify(state.disabledSites)) return { domain: normalizedDomain, disabled, changed: false };
    const candidateState = { ...state, disabledSites: nextSites };
    await commitPersistentPolicy(candidateState, "site protection");
    return { domain: normalizedDomain, disabled, changed: true };
  }

  async function setSessionSitePausedTransactional(domain, paused) {
    if (typeof paused !== "boolean") throw new Error("Session pause state must be boolean");
    const normalizedDomain = normalizeDomain(domain);
    const session = await loadSessionState(api);
    const nextSites = setSiteDisabled(session.disabledSites, normalizedDomain, paused);
    if (JSON.stringify(nextSites) === JSON.stringify(session.disabledSites)) return { domain: normalizedDomain, paused, changed: false };
    const candidateSession = { disabledSites: nextSites };
    await commitSessionPolicy(candidateSession, "session pause");
    return { domain: normalizedDomain, paused, changed: true };
  }

  async function addPersonalBlock(target, kind) {
    const candidate = kind === "domain" ? { kind: "domain", value: normalizeDomain(target) } : { kind: "url", value: normalizeHttpUrl(target) };
    const result = await addPersonalRule("personalBlock", candidate);
    return result.changed;
  }

  async function loadBundledDefaultEntry() {
    const [metadataResponse, listResponse] = await Promise.all([fetchImpl(api.runtime.getURL("lists/default.meta.json")), fetchImpl(api.runtime.getURL("lists/default.txt"))]);
    if (!metadataResponse.ok || !listResponse.ok) throw new Error("Bundled default list is unavailable");
    const metadata = validateListMetadata(await metadataResponse.json());
    if (metadata.id !== DEFAULT_COMMUNITY_SUBSCRIPTION.id) throw new Error("Bundled default list metadata id mismatch");
    const parsed = parseList(await listResponse.text(), metadata.format);
    return makeCacheEntry({ ...parsed, sourceKey: subscriptionSourceKey(DEFAULT_COMMUNITY_SUBSCRIPTION) }, 0, 0);
  }

  async function seedBundledDefault(cache) {
    if (cache[DEFAULT_COMMUNITY_SUBSCRIPTION.id]) return cache;
    return { ...cache, [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: await loadBundledDefaultEntry() };
  }

  async function commitCachePolicy(state, candidateCache, label) {
    const transaction = await activateCandidatePolicy(state, candidateCache);
    try { await saveListCache(api, candidateCache); }
    catch (error) { await rollbackCandidatePolicy(transaction, `${label} cache`); throw error; }
  }

  async function prepareListRefresh(force = false) {
    const forceRefresh = strictRefreshForce(force);
    const state = await loadState(api);
    const persistedCache = await loadListCache(api);
    const preparedEntries = Object.create(null);
    let workingCache = persistedCache;
    if (!workingCache[DEFAULT_COMMUNITY_SUBSCRIPTION.id]) {
      const bundled = await loadBundledDefaultEntry();
      preparedEntries[DEFAULT_COMMUNITY_SUBSCRIPTION.id] = bundled;
      workingCache = { ...workingCache, [DEFAULT_COMMUNITY_SUBSCRIPTION.id]: bundled };
    }
    const candidateCache = pruneListCache(state.subscriptions, workingCache);
    let hadFailure = false;
    const timestamp = now();
    for (const subscription of state.subscriptions) {
      if (!subscription.enabled) continue;
      const existing = candidateCache[subscription.id];
      if (!forceRefresh && !isRefreshDue(existing, timestamp)) continue;
      try {
        const parsed = await downloadAndParseSubscription(subscription, fetchImpl);
        const entry = makeCacheEntry(parsed, timestamp, state.updateIntervalHours * 60 * 60 * 1000);
        candidateCache[subscription.id] = entry;
        preparedEntries[subscription.id] = entry;
      } catch { hadFailure = true; }
    }
    return { preparedEntries, hadFailure };
  }

  async function commitPreparedListRefresh(prepared) {
    const [state, persistedCache] = await Promise.all([loadState(api), loadListCache(api)]);
    const workingCache = pruneListCache(state.subscriptions, persistedCache);
    for (const [id, entry] of Object.entries(prepared.preparedEntries)) workingCache[id] = entry;
    const candidateCache = pruneListCache(state.subscriptions, workingCache);
    const cacheChanged = cacheFingerprint(candidateCache) !== cacheFingerprint(persistedCache);
    if (!cacheChanged) { await activateCandidatePolicy(state, candidateCache); return prepared.hadFailure ? "fallback" : "current"; }
    await commitCachePolicy(state, candidateCache, "list refresh");
    return prepared.hadFailure ? "updated-with-fallback" : "updated";
  }

  async function refreshListsOnce(force = false) {
    const prepared = await prepareListRefresh(force);
    return queueTask(() => commitPreparedListRefresh(prepared));
  }

  function queueListRefresh(force = false) {
    const forceRefresh = strictRefreshForce(force);
    return queueListTask(() => refreshListsOnce(forceRefresh));
  }

  async function addExternalSubscription(subscription) {
    const sourceRecord = externalSubscriptionSnapshot(subscription);
    const candidate = normalizeSubscription({ ...sourceRecord, builtIn: false });
    const initialState = await loadState(api);
    if (initialState.subscriptions.some((item) => item.id === candidate.id)) throw new Error("A filter list with this id is already configured");
    const candidateSource = subscriptionSourceKey(candidate);
    if (initialState.subscriptions.some((item) => subscriptionSourceKey(item) === candidateSource)) throw new Error("This filter list source is already configured");
    const parsed = await downloadAndParseSubscription(candidate, fetchImpl);
    const preparedEntry = makeCacheEntry(parsed, now(), initialState.updateIntervalHours * 60 * 60 * 1000);

    return queueTask(async () => {
      const [state, cache] = await Promise.all([loadState(api), loadListCache(api)]);
      if (state.subscriptions.some((item) => item.id === candidate.id)) throw new Error("A filter list with this id is already configured");
      if (state.subscriptions.some((item) => subscriptionSourceKey(item) === candidateSource)) throw new Error("This filter list source is already configured");
      const candidateState = { ...state, subscriptions: [...state.subscriptions, candidate] };
      let candidateCache = pruneListCache(candidateState.subscriptions, cache);
      candidateCache[candidate.id] = preparedEntry;
      candidateCache = pruneListCache(candidateState.subscriptions, candidateCache);
      if (!candidateCache[candidate.id]) throw new Error("Filter list source changed before activation");
      const transaction = await activateCandidatePolicy(candidateState, candidateCache);
      try { await saveStateAndListCache(api, candidateState, candidateCache); }
      catch (error) { await rollbackCandidatePolicy(transaction, "subscription"); throw error; }
      return { id: candidate.id, title: candidate.title };
    });
  }

  async function commitSubscriptionMutation(candidateState, candidateCache, rollbackLabel) {
    const transaction = await activateCandidatePolicy(candidateState, candidateCache);
    try { await saveStateAndListCache(api, candidateState, candidateCache); }
    catch (error) { await rollbackCandidatePolicy(transaction, rollbackLabel); throw error; }
  }

  async function setSubscriptionEnabled(id, enabled) {
    if (typeof id !== "string" || !id) throw new Error("Subscription id is required");
    if (typeof enabled !== "boolean") throw new Error("Subscription enabled state must be boolean");
    const [initialState, initialCache] = await Promise.all([loadState(api), loadListCache(api)]);
    const initial = initialState.subscriptions.find((item) => item.id === id);
    if (!initial) throw new Error("Filter list is not configured");

    let preparedEntry = null;
    let preparedSource = "none";
    if (enabled && !pruneListCache(initialState.subscriptions, initialCache)[id]) {
      if (id === DEFAULT_COMMUNITY_SUBSCRIPTION.id) {
        preparedEntry = await loadBundledDefaultEntry();
        preparedSource = "bundled";
      } else {
        const parsed = await downloadAndParseSubscription(initial, fetchImpl);
        preparedEntry = makeCacheEntry(parsed, now(), initialState.updateIntervalHours * 60 * 60 * 1000);
        preparedSource = "fetched";
      }
    }

    return queueTask(async () => {
      const [state, currentCache] = await Promise.all([loadState(api), loadListCache(api)]);
      const index = state.subscriptions.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("Filter list is not configured");
      const current = state.subscriptions[index];
      let candidateCache = pruneListCache(state.subscriptions, currentCache);
      if (current.enabled === enabled && (!enabled || candidateCache[id])) return { id, enabled, source: "unchanged" };

      const candidateState = {
        ...state,
        subscriptions: state.subscriptions.map((item, itemIndex) => itemIndex === index ? { ...item, enabled } : item)
      };
      candidateCache = pruneListCache(candidateState.subscriptions, candidateCache);
      let source = candidateCache[id] ? "cache" : preparedSource;
      if (enabled && !candidateCache[id]) {
        if (!preparedEntry) throw new Error("Filter list source is not available for activation");
        candidateCache[id] = preparedEntry;
        candidateCache = pruneListCache(candidateState.subscriptions, candidateCache);
        if (!candidateCache[id]) throw new Error("Filter list source changed before activation");
      }
      await commitSubscriptionMutation(candidateState, candidateCache, "subscription enable/disable");
      return { id, enabled, source };
    });
  }

  async function removeExternalSubscription(id) {
    if (typeof id !== "string" || !id) throw new Error("Subscription id is required");
    const [state, currentCache] = await Promise.all([loadState(api), loadListCache(api)]);
    const subscription = state.subscriptions.find((item) => item.id === id);
    if (!subscription) throw new Error("Filter list is not configured");
    if (subscription.builtIn) throw new Error("Built-in filter lists cannot be removed");
    const candidateState = { ...state, subscriptions: state.subscriptions.filter((item) => item.id !== id) };
    const candidateCache = pruneListCache(candidateState.subscriptions, currentCache);
    await commitSubscriptionMutation(candidateState, candidateCache, "subscription removal");
    return { id, title: subscription.title };
  }

  function remapReusableCache(currentState, currentCache, candidateState) {
    const cacheBySource = new Map();
    for (const subscription of currentState.subscriptions) { const entry = currentCache[subscription.id]; if (entry) cacheBySource.set(subscriptionSourceKey(subscription), entry); }
    const candidateCache = {};
    for (const subscription of candidateState.subscriptions) { const reusable = cacheBySource.get(subscriptionSourceKey(subscription)); if (reusable) candidateCache[subscription.id] = structuredClone(reusable); }
    return candidateCache;
  }

  async function importSettingsBackup(backupText) {
    const candidateState = parseSettingsBackup(backupText);
    const [currentState, currentCache] = await Promise.all([loadState(api), loadListCache(api)]);
    let preparedCache = remapReusableCache(currentState, currentCache, candidateState);
    preparedCache = await seedBundledDefault(preparedCache);
    let fetchedSources = 0;
    for (const subscription of candidateState.subscriptions) {
      if (!subscription.enabled || preparedCache[subscription.id]) continue;
      try {
        const parsed = await downloadAndParseSubscription(subscription, fetchImpl);
        preparedCache[subscription.id] = makeCacheEntry(parsed, now(), candidateState.updateIntervalHours * 60 * 60 * 1000);
        fetchedSources += 1;
      } catch (error) { throw new Error(boundedImportActivationError(error, subscription.title)); }
    }
    preparedCache = pruneListCache(candidateState.subscriptions, preparedCache);

    return queueTask(async () => {
      const [latestState, latestCache] = await Promise.all([loadState(api), loadListCache(api)]);
      const candidateCache = remapReusableCache(latestState, latestCache, candidateState);
      for (const [id, entry] of Object.entries(preparedCache)) candidateCache[id] = entry;
      const finalCache = pruneListCache(candidateState.subscriptions, candidateCache);
      const transaction = await activateCandidatePolicy(candidateState, finalCache);
      try { await saveStateAndListCache(api, candidateState, finalCache); }
      catch (error) { await rollbackCandidatePolicy(transaction, "settings import"); throw error; }
      try { await scheduleListRefresh(candidateState); }
      catch (error) { logger.warn("drop-ads imported settings but could not reschedule list refresh until next startup", error); }
      return { subscriptions: candidateState.subscriptions.length, fetchedSources };
    });
  }

  async function scheduleListRefresh(state = null) {
    const effectiveState = state ?? await loadState(api);
    const periodInMinutes = Math.max(60, effectiveState.updateIntervalHours * 60);
    await Promise.resolve(alarmClear(LIST_REFRESH_ALARM));
    await Promise.resolve(alarmCreate(LIST_REFRESH_ALARM, { periodInMinutes }));
  }

  async function initializeRuntime(options = {}) {
    assertPlainExactObject(options, "Runtime initialization options", RUNTIME_INITIALIZE_OPTION_KEYS);
    const repairState = Object.hasOwn(options, "repairState") ? optionValue(options, "repairState") : false;
    if (typeof repairState !== "boolean") throw new TypeError("Runtime initialization repairState must be boolean");
    if (repairState) await initializeState(api);
    await installContextMenus();
    await scheduleListRefresh();
    await syncRules();
    void queueListRefresh(false).catch((error) => logger.warn("drop-ads list refresh failed; keeping existing rules", error));
  }

  function respondTask(task, sendResponse, fallback) {
    void queueTask(task)
      .then((result) => sendResponseBestEffort(sendResponse, { ok: true, result }))
      .catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, fallback) }));
    return true;
  }

  function registerListener(collaborators, listener) {
    collaborators.add(listener);
    listenerRegistrations.push(Object.freeze({ remove: collaborators.remove, listener }));
  }

  function removeListenerBestEffort(remove, listener) {
    if (!remove) return;
    try { remove(listener); } catch { /* teardown must continue across independent browser event sources */ }
  }

  function rollbackRegisteredListeners(startIndex = 0) {
    const registrations = listenerRegistrations.splice(startIndex).reverse();
    for (const registration of registrations) removeListenerBestEffort(registration.remove, registration.listener);
  }

  const onInstalled = () => { if (!disposed) void queueTask(() => initializeRuntime({ repairState: true })).catch((error) => logger.error("drop-ads installation initialization failed", error)); };
  const onStartup = () => { if (!disposed) void queueTask(() => initializeRuntime()).catch((error) => logger.error("drop-ads startup initialization failed", error)); };
  const onContextClicked = (info) => {
    if (disposed) return;
    const fields = eventFields(info, ["menuItemId"], ["srcUrl", "linkUrl", "frameUrl"]);
    if (!fields) return;
    const supportedMenu = fields.menuItemId === MENU_BLOCK_DEFAULT || fields.menuItemId === MENU_BLOCK_EXACT || fields.menuItemId === MENU_BLOCK_DOMAIN;
    if (!supportedMenu) return;
    const target = fields.srcUrl ?? fields.linkUrl ?? fields.frameUrl ?? null;
    if (!target) return;
    const kind = fields.menuItemId === MENU_BLOCK_EXACT ? "url" : "domain";
    void queueTask(() => addPersonalBlock(target, kind)).catch((error) => logger.error("drop-ads failed to add local block", error));
  };
  const onAlarm = (alarm) => {
    if (disposed) return;
    const fields = eventFields(alarm, ["name"]);
    if (!fields || fields.name !== LIST_REFRESH_ALARM) return;
    void queueListRefresh(false).catch((error) => logger.warn("drop-ads list refresh failed; keeping last-known-good cache", error));
  };
  const onMessage = (message, _sender, sendResponse) => {
    if (disposed) return false;
    const typeFields = eventFields(message, ["type"]);
    if (!typeFields) return false;
    const type = typeFields.type;
    if (type === "drop-ads:get-ui-state") return respondTask(uiStateSnapshot, sendResponse, "Could not read current protection state");
    if (type === "drop-ads:refresh-lists") {
      const fields = eventFields(message, ["type"], ["force"]); if (!fields) return false;
      void queueListRefresh(fields.force === true).then((status) => sendResponseBestEffort(sendResponse, { ok: true, status })).catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, "List refresh failed") })); return true;
    }
    if (type === "drop-ads:add-subscription") {
      const fields = eventFields(message, ["type", "subscription"]); if (!fields) return false;
      void queueListTask(() => addExternalSubscription(fields.subscription)).then((subscription) => sendResponseBestEffort(sendResponse, { ok: true, subscription })).catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, "Could not add filter list") })); return true;
    }
    if (type === "drop-ads:set-subscription-enabled") {
      const fields = eventFields(message, ["type", "id", "enabled"]); if (!fields) return false;
      void queueListTask(() => setSubscriptionEnabled(fields.id, fields.enabled)).then((subscription) => sendResponseBestEffort(sendResponse, { ok: true, subscription })).catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, "Could not change filter list state") })); return true;
    }
    if (type === "drop-ads:remove-subscription") {
      const fields = eventFields(message, ["type", "id"]); if (!fields) return false;
      void queueTask(() => removeExternalSubscription(fields.id)).then((subscription) => sendResponseBestEffort(sendResponse, { ok: true, subscription })).catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, "Could not remove filter list") })); return true;
    }
    if (type === "drop-ads:set-enabled") { const fields = eventFields(message, ["type", "enabled"]); return fields ? respondTask(() => setGlobalEnabled(fields.enabled), sendResponse, "Could not change global protection") : false; }
    if (type === "drop-ads:add-personal-rule") { const fields = eventFields(message, ["type", "field", "rule"]); return fields ? respondTask(() => addPersonalRule(fields.field, fields.rule), sendResponse, "Could not add personal rule") : false; }
    if (type === "drop-ads:remove-personal-rule") { const fields = eventFields(message, ["type", "field", "key"]); return fields ? respondTask(() => removePersonalRule(fields.field, fields.key), sendResponse, "Could not remove personal rule") : false; }
    if (type === "drop-ads:set-cookie-mode") { const fields = eventFields(message, ["type", "cookieMode"]); return fields ? respondTask(() => setCookieMode(fields.cookieMode), sendResponse, "Could not change cookie mode") : false; }
    if (type === "drop-ads:set-cookie-exception") { const fields = eventFields(message, ["type", "domain", "allowed"]); return fields ? respondTask(() => setCookieException(fields.domain, fields.allowed), sendResponse, "Could not change cookie exception") : false; }
    if (type === "drop-ads:set-site-disabled") { const fields = eventFields(message, ["type", "domain", "disabled"]); return fields ? respondTask(() => setPersistentSiteDisabled(fields.domain, fields.disabled), sendResponse, "Could not change site protection") : false; }
    if (type === "drop-ads:set-session-site-paused") { const fields = eventFields(message, ["type", "domain", "paused"]); return fields ? respondTask(() => setSessionSitePausedTransactional(fields.domain, fields.paused), sendResponse, "Could not change session pause") : false; }
    if (type === "drop-ads:import-settings") {
      const fields = eventFields(message, ["type", "backupText"]); if (!fields) return false;
      void queueListTask(() => importSettingsBackup(fields.backupText)).then((summary) => sendResponseBestEffort(sendResponse, { ok: true, ...summary })).catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, "Could not import settings") })); return true;
    }
    if (type === "drop-ads:submit-community") {
      const fields = eventFields(message, ["type", "rule"]); if (!fields) return false;
      void queueTask(() => openCommunitySubmission(fields.rule)).then(() => sendResponseBestEffort(sendResponse, { ok: true })).catch((error) => sendResponseBestEffort(sendResponse, { ok: false, error: backgroundCaughtErrorMessage(error, "Could not prepare community submission") })); return true;
    }
    return false;
  };
  const onStorageChanged = (changes, areaName) => {
    if (disposed) return;
    const fields = eventFields(changes, [], [STORAGE_KEY, SESSION_STORAGE_KEY]);
    if (!fields) return;
    const localStateChanged = areaName === "local" && Object.hasOwn(fields, STORAGE_KEY) && localPolicyChanged(fields[STORAGE_KEY]);
    const sessionStateChanged = areaName === "session" && Object.hasOwn(fields, SESSION_STORAGE_KEY);
    if (!localStateChanged && !sessionStateChanged) return;
    void queueRuleRepair().catch((error) => logger.error("drop-ads failed to repair rules after storage change", error));
  };

  function start() {
    if (disposed) throw disposedError();
    if (started) return controller;
    const startIndex = listenerRegistrations.length;
    try {
      registerListener(events.installed, onInstalled);
      registerListener(events.startup, onStartup);
      registerListener(events.contextClicked, onContextClicked);
      registerListener(events.alarm, onAlarm);
      registerListener(events.message, onMessage);
      registerListener(events.storageChanged, onStorageChanged);
      started = true;
      return controller;
    } catch (error) {
      rollbackRegisteredListeners(startIndex);
      started = false;
      throw error;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    started = false;
    rollbackRegisteredListeners(0);
  }

  async function whenIdle() {
    while (true) {
      const observedTaskQueue = taskQueue;
      const observedListTaskQueue = listTaskQueue;
      await Promise.all([observedTaskQueue, observedListTaskQueue]);
      if (observedTaskQueue === taskQueue && observedListTaskQueue === listTaskQueue) return;
    }
  }

  const controller = Object.freeze({
    start, dispose, whenIdle,
    syncRules: () => queueTask(syncRules),
    refreshListsOnce: (force = false) => queueListRefresh(force),
    queueListRefresh,
    initializeRuntime: (options) => queueTask(() => initializeRuntime(options)),
    uiStateSnapshot: () => queueTask(uiStateSnapshot),
    addPersonalBlock: (...args) => queueTask(() => addPersonalBlock(...args)),
    addPersonalRule: (...args) => queueTask(() => addPersonalRule(...args)),
    removePersonalRule: (...args) => queueTask(() => removePersonalRule(...args)),
    setGlobalEnabled: (...args) => queueTask(() => setGlobalEnabled(...args)),
    setCookieMode: (...args) => queueTask(() => setCookieMode(...args)),
    setCookieException: (...args) => queueTask(() => setCookieException(...args)),
    setPersistentSiteDisabled: (...args) => queueTask(() => setPersistentSiteDisabled(...args)),
    setSessionSitePausedTransactional: (...args) => queueTask(() => setSessionSitePausedTransactional(...args)),
    addExternalSubscription: (...args) => queueListTask(() => addExternalSubscription(...args)),
    setSubscriptionEnabled: (...args) => queueListTask(() => setSubscriptionEnabled(...args)),
    removeExternalSubscription: (...args) => queueTask(() => removeExternalSubscription(...args)),
    importSettingsBackup: (...args) => queueListTask(() => importSettingsBackup(...args)),
    dynamicRuleLimit
  });
  return controller;
}
