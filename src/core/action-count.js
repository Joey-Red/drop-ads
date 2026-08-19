import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";

export const ACTION_COUNT_PREFERENCE_KEY = "dropAdsActionCountBadgeEnabled";

const ACTION_COUNT_OPTION_KEYS = new Set(["api", "logger"]);
const installations = new WeakMap();
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function optionValue(options, key) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new TypeError(`Action count option ${key} must remain an own enumerable data field`);
  return field.present ? field.value : undefined;
}

function receiverCall(callback, receiver) {
  return (...args) => Reflect.apply(callback, receiver, args);
}

function suppliedLogger(options) {
  const loggerField = readPlainDataField(options, "logger");
  if (!loggerField.safe) throw new TypeError("Action count logger option is invalid");
  if (!loggerField.present) return Object.freeze({ warn: receiverCall(console.warn, console) });
  const logger = loggerField.value;
  const warnField = readPlainDataField(logger, "warn");
  if (!warnField.safe || !warnField.present || typeof warnField.value !== "function") {
    throw new TypeError("Action count logger must provide warn()");
  }
  return Object.freeze({ warn: receiverCall(warnField.value, logger) });
}

function warnBestEffort(logger, ...args) {
  try { logger.warn(...args); } catch { /* optional action-count logging must not escape */ }
}

function storageReadPreferenceValue(result) {
  const field = readPlainDataField(result, ACTION_COUNT_PREFERENCE_KEY);
  if (!field.safe || !field.present) return undefined;
  return field.value;
}

function hasSafePreferenceChange(changes) {
  const field = readPlainDataField(changes, ACTION_COUNT_PREFERENCE_KEY);
  return field.safe && field.present;
}

function captureDataProperty(receiver, key, label, required = true) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    if (!required) return undefined;
    throw new TypeError(`${label} is unavailable`);
  }
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
  if (!required) return undefined;
  throw new TypeError(`${label} is unavailable`);
}

function captureBoundMethod(receiver, key, label, required = true) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    if (!required) return null;
    throw new TypeError(`${label} is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(current, key); }
    catch { throw new TypeError(`${label} is not safely inspectable`); }
    if (descriptor) {
      if (!("value" in descriptor) || typeof descriptor.value !== "function") {
        if (!required) return null;
        throw new TypeError(`${label} must be a data function`);
      }
      return receiverCall(descriptor.value, receiver);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

function captureActionCountNamespaces(api) {
  const storage = captureDataProperty(api, "storage", "Action count storage namespace", false);
  const localStorage = storage
    ? captureDataProperty(storage, "local", "Action count storage.local namespace", false)
    : undefined;
  const storageChanged = storage
    ? captureDataProperty(storage, "onChanged", "Action count storage.onChanged event", false)
    : undefined;
  const dnr = captureDataProperty(api, "declarativeNetRequest", "Action count declarativeNetRequest namespace", false);
  return Object.freeze({ storage, localStorage, storageChanged, dnr });
}

function captureActionCountOperations(api, requirements = {}, namespaces = captureActionCountNamespaces(api)) {
  const get = captureBoundMethod(namespaces.localStorage, "get", "Action count storage.local.get", requirements.get === true);
  const set = captureBoundMethod(namespaces.localStorage, "set", "Action count storage.local.set", requirements.set === true);
  const setExtensionActionOptions = captureBoundMethod(
    namespaces.dnr,
    "setExtensionActionOptions",
    "Action count declarativeNetRequest.setExtensionActionOptions",
    false
  );
  return Object.freeze({ get, set, setExtensionActionOptions });
}

async function loadActionCountEnabledWith(operations) {
  if (!operations.get) throw new TypeError("Action count storage.local.get is unavailable");
  const result = await operations.get(ACTION_COUNT_PREFERENCE_KEY);
  const value = storageReadPreferenceValue(result);
  return typeof value === "boolean" ? value : true;
}

async function applyActionCountPreferenceWith(operations, enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("Action count preference must be boolean");
  if (!operations.setExtensionActionOptions) return false;
  await operations.setExtensionActionOptions({ displayActionCountAsBadgeText: enabled });
  return true;
}

function removeListenerBestEffort(removeListener, listener) {
  if (!removeListener) return;
  try { removeListener(listener); } catch { /* optional listener teardown must not escape */ }
}

export function supportsActionCount(api) {
  try {
    return Boolean(captureActionCountOperations(api).setExtensionActionOptions);
  } catch {
    return false;
  }
}

export async function loadActionCountEnabled(api) {
  const operations = captureActionCountOperations(api, { get: true });
  return loadActionCountEnabledWith(operations);
}

export async function applyActionCountPreference(api, enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("Action count preference must be boolean");
  const operations = captureActionCountOperations(api);
  return applyActionCountPreferenceWith(operations, enabled);
}

export async function setActionCountEnabled(api, enabled) {
  if (typeof enabled !== "boolean") throw new TypeError("Action count preference must be boolean");
  const operations = captureActionCountOperations(api, { get: true, set: true });
  const previous = await loadActionCountEnabledWith(operations);
  await applyActionCountPreferenceWith(operations, enabled);
  try {
    await operations.set({ [ACTION_COUNT_PREFERENCE_KEY]: enabled });
  } catch (error) {
    try { await applyActionCountPreferenceWith(operations, previous); } catch { /* best-effort UI-preference rollback */ }
    throw error;
  }
  return { enabled, supported: Boolean(operations.setExtensionActionOptions), changed: previous !== enabled };
}

export function installActionCount(options = {}) {
  assertPlainExactObject(options, "Action count options", ACTION_COUNT_OPTION_KEYS);
  const api = optionValue(options, "api");
  const existing = installations.get(api);
  if (existing) return existing;

  const logger = suppliedLogger(options);
  const namespaces = captureActionCountNamespaces(api);
  if (!namespaces.localStorage || !namespaces.storageChanged) return { dispose() {} };
  const syncOperations = captureActionCountOperations(api, { get: true }, namespaces);
  const addStorageChangedListener = captureBoundMethod(namespaces.storageChanged, "addListener", "Action count storage change addListener");
  const removeStorageChangedListener = captureBoundMethod(namespaces.storageChanged, "removeListener", "Action count storage change removeListener", false);

  let disposed = false;
  let queue = Promise.resolve();

  const run = (task) => {
    const operation = queue.then(task, task);
    queue = operation.catch(() => undefined);
    return operation;
  };

  const sync = () => run(async () => {
    if (disposed) return;
    const enabled = await loadActionCountEnabledWith(syncOperations);
    if (disposed) return;
    await applyActionCountPreferenceWith(syncOperations, enabled);
  }).catch((error) => {
    if (!disposed) warnBestEffort(logger, "drop-ads could not apply the browser-owned protection action count", error);
  });

  const onChanged = (changes, areaName) => {
    if (disposed || areaName !== "local" || !hasSafePreferenceChange(changes)) return;
    void sync();
  };

  try {
    addStorageChangedListener(onChanged);
  } catch (error) {
    removeListenerBestEffort(removeStorageChangedListener, onChanged);
    throw error;
  }
  void sync();

  const registration = {
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        removeListenerBestEffort(removeStorageChangedListener, onChanged);
      } finally {
        if (installations.get(api) === registration) installations.delete(api);
      }
    },
    whenIdle() { return queue; }
  };
  installations.set(api, registration);
  return registration;
}
