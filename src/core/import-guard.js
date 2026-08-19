import { parseSettingsBackup } from "./settings-backup.js";
import { loadListCache, loadState } from "./storage.js";
import {
  DEFAULT_COMMUNITY_SUBSCRIPTION,
  MAX_NORMALIZED_SUBSCRIPTIONS,
  normalizeSubscription,
  subscriptionSourceKey
} from "./subscriptions.js";
import { decodeCacheEntry } from "./cache-codec.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { snapshotRawListCache } from "./cache-storage.js";

export const MAX_IMPORT_REMOTE_ACTIVATIONS = 16;
export const MAX_IMPORT_GUARD_ERROR_CHARS = 1_024;
const IMPORT_GUARD_OPTION_KEYS = new Set(["preflight"]);
const IMPORT_MESSAGE_KEYS = new Set(["type", "backupText"]);
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function stateSubscriptionCandidates(state, label) {
  const field = readPlainDataField(state, "subscriptions");
  if (!field.safe) throw new TypeError(`${label} must be a plain object with an own enumerable subscriptions data field when present`);
  if (!field.present) return [];
  let isArray;
  try { isArray = Array.isArray(field.value); }
  catch { throw new TypeError(`${label}.subscriptions array kind is invalid`); }
  if (!isArray) return [];
  return snapshotDenseDataArray(field.value, `${label}.subscriptions`, MAX_NORMALIZED_SUBSCRIPTIONS);
}

function normalizedStateSubscriptions(state, label, { discardInvalid = false } = {}) {
  const normalized = [];
  for (const candidate of stateSubscriptionCandidates(state, label)) {
    try { normalized.push(normalizeSubscription(candidate)); }
    catch (error) { if (!discardInvalid) throw error; }
  }
  return normalized;
}

function cacheSourcesForCurrentState(state, cache) {
  const reusable = new Set();
  let boundedCache;
  try { boundedCache = snapshotRawListCache(cache); }
  catch { boundedCache = Object.create(null); }
  for (const subscription of normalizedStateSubscriptions(state, "Current state", { discardInvalid: true })) {
    const rawEntry = Object.hasOwn(boundedCache, subscription.id) ? boundedCache[subscription.id] : undefined;
    if (!rawEntry) continue;
    const expectedSourceKey = subscriptionSourceKey(subscription);
    const decoded = decodeCacheEntry(rawEntry);
    if (!decoded || decoded.sourceKey !== expectedSourceKey) continue;
    reusable.add(expectedSourceKey);
  }
  return reusable;
}

export function pendingImportRemoteActivations(candidateState, currentState, currentCache) {
  const reusableSources = cacheSourcesForCurrentState(currentState, currentCache);
  const pending = [];
  for (const subscription of normalizedStateSubscriptions(candidateState, "Candidate state")) {
    if (!subscription.enabled) continue;
    if (subscription.id === DEFAULT_COMMUNITY_SUBSCRIPTION.id) continue;
    const sourceKey = subscriptionSourceKey(subscription);
    if (!reusableSources.has(sourceKey)) pending.push(subscription);
  }
  return Object.freeze(pending);
}

export function assertImportRemoteActivationBudget(candidateState, currentState, currentCache, limit = MAX_IMPORT_REMOTE_ACTIVATIONS) {
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > MAX_IMPORT_REMOTE_ACTIVATIONS) throw new Error(`Import remote activation limit must be a safe integer from 0 through ${MAX_IMPORT_REMOTE_ACTIVATIONS}`);
  const pending = pendingImportRemoteActivations(candidateState, currentState, currentCache);
  if (pending.length > limit) throw new Error(`Settings import requires ${pending.length} uncached enabled filter sources; the per-import limit is ${limit}. Disable some sources and enable them individually after import.`);
  return pending;
}

export async function preflightSettingsImport(api, backupText) {
  const candidateState = parseSettingsBackup(backupText);
  const [currentState, currentCache] = await Promise.all([loadState(api), loadListCache(api)]);
  return assertImportRemoteActivationBudget(candidateState, currentState, currentCache);
}

function importMessageSnapshot(message) {
  assertPlainExactObject(message, "Settings import message", IMPORT_MESSAGE_KEYS);
  const type = readPlainDataField(message, "type");
  const backup = readPlainDataField(message, "backupText");
  if (!type.safe || !type.present || type.value !== "drop-ads:import-settings") throw new TypeError("Settings import type must be an exact data field");
  if (!backup.safe || !backup.present || typeof backup.value !== "string") throw new TypeError("Settings import backupText must be a string data field");
  return Object.freeze({ type: type.value, backupText: backup.value });
}

function importGuardFailureMessage(error, fallback = "Settings import preflight failed") {
  if (typeof fallback !== "string" || !fallback || fallback.length > MAX_IMPORT_GUARD_ERROR_CHARS) throw new TypeError("Import guard error fallback is invalid");
  if (!error || (typeof error !== "object" && typeof error !== "function")) return fallback;
  let descriptor;
  try { descriptor = Object.getOwnPropertyDescriptor(error, "message"); }
  catch { return fallback; }
  if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "string") return fallback;
  return descriptor.value.length > 0 && descriptor.value.length <= MAX_IMPORT_GUARD_ERROR_CHARS ? descriptor.value : fallback;
}

function importGuardFailurePayload(error) {
  return Object.freeze({ ok: false, error: importGuardFailureMessage(error) });
}

function sendResponseBestEffort(sendResponse, payload) {
  if (typeof sendResponse !== "function") return false;
  try { sendResponse(payload); return true; }
  catch { return false; }
}

function captureReceiverData(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError(`${label} receiver is unavailable`);
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
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

function captureReceiverMethod(receiver, key, label, required = true) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    if (!required) return null;
    throw new TypeError(`${label} receiver is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        if (!required && "value" in descriptor && descriptor.value == null) return null;
        throw new TypeError(`${label} must be a data function`);
      }
      const callback = descriptor.value;
      return (...args) => Reflect.apply(callback, receiver, args);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

export function createImportGuardedApi(api, options = {}) {
  assertPlainExactObject(options, "Import guard options", IMPORT_GUARD_OPTION_KEYS);
  const preflightField = readPlainDataField(options, "preflight");
  if (!preflightField.safe) throw new TypeError("Import guard preflight option must be an own enumerable data field when present");
  const preflight = preflightField.present ? preflightField.value : (backupText) => preflightSettingsImport(api, backupText);
  if (typeof preflight !== "function") throw new TypeError("Import preflight must be a function");

  const rawRuntime = captureReceiverData(api, "runtime", "Import guard runtime");
  const rawOnMessage = captureReceiverData(rawRuntime, "onMessage", "Import guard runtime.onMessage");
  const addRawListener = captureReceiverMethod(rawOnMessage, "addListener", "Import guard runtime.onMessage.addListener");
  const removeRawListener = captureReceiverMethod(rawOnMessage, "removeListener", "Import guard runtime.onMessage.removeListener", false);
  const wrappers = new Map();

  function makeWrapper(listener) {
    let wrapper;
    wrapper = (message, sender, sendResponse) => {
      if (wrappers.get(listener) !== wrapper) return false;
      const type = readPlainDataField(message, "type");
      if (!type.safe || !type.present || type.value !== "drop-ads:import-settings") return listener(message, sender, sendResponse);
      let snapshot;
      try { snapshot = importMessageSnapshot(message); }
      catch (error) {
        sendResponseBestEffort(sendResponse, importGuardFailurePayload(error));
        return false;
      }
      void Promise.resolve()
        .then(() => preflight(snapshot.backupText))
        .then(() => {
          if (wrappers.get(listener) !== wrapper) return false;
          return listener(snapshot, sender, sendResponse);
        })
        .catch((error) => {
          if (wrappers.get(listener) !== wrapper) return;
          sendResponseBestEffort(sendResponse, importGuardFailurePayload(error));
        });
      return true;
    };
    return wrapper;
  }

  const guardedOnMessage = Object.freeze({
    addListener(listener) {
      if (typeof listener !== "function") throw new TypeError("Import guard listener must be a function");
      if (wrappers.has(listener)) return;
      const wrapper = makeWrapper(listener);
      wrappers.set(listener, wrapper);
      try { addRawListener(wrapper); }
      catch (error) { if (wrappers.get(listener) === wrapper) wrappers.delete(listener); throw error; }
    },
    removeListener(listener) {
      const wrapper = wrappers.get(listener);
      if (!wrapper) return;
      wrappers.delete(listener);
      if (!removeRawListener) return;
      try { removeRawListener(wrapper); } catch { }
    },
    hasListener(listener) { return wrappers.has(listener); }
  });

  const guardedRuntime = new Proxy(rawRuntime, {
    get(target, property, receiver) {
      if (property === "onMessage") return guardedOnMessage;
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return (...args) => Reflect.apply(value, target, args);
    }
  });

  return new Proxy(api, {
    get(target, property, receiver) {
      if (property === "runtime") return guardedRuntime;
      return Reflect.get(target, property, receiver);
    }
  });
}
