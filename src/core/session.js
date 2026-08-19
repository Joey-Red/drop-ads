import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { normalizeDomainSet, setSiteDisabled } from "./personal-rules.js";
import { normalizeDomain } from "./rules.js";
import { LIVE_STATE_LIMITS } from "./state-limits.js";

export const SESSION_STORAGE_KEY = "dropAdsSessionState";
const EMPTY_SESSION_COLLECTION = Object.freeze([]);
export const DEFAULT_SESSION_STATE = Object.freeze({ disabledSites: EMPTY_SESSION_COLLECTION });
const SESSION_STATE_KEYS = new Set(["disabledSites"]);
const SESSION_STORAGE_RESULT_KEYS = new Set([SESSION_STORAGE_KEY]);
const SESSION_NORMALIZE_OPTION_KEYS = new Set(["strictShape"]);
const MAX_SESSION_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function cloneDefaultSessionState() {
  return Object.freeze({ disabledSites: Object.freeze([]) });
}

function sessionStorageValue(result) {
  assertPlainExactObject(result, "Session storage result", SESSION_STORAGE_RESULT_KEYS);
  const field = readPlainDataField(result, SESSION_STORAGE_KEY);
  if (!field.safe) throw new Error("Session storage result must contain an own enumerable data field");
  return field.present ? field.value : undefined;
}

function sessionStorageWritePayload(state) {
  return Object.freeze({ [SESSION_STORAGE_KEY]: state });
}

function strictShapeOption(options) {
  assertPlainExactObject(options, "Session normalization options", SESSION_NORMALIZE_OPTION_KEYS);
  const field = readPlainDataField(options, "strictShape");
  if (!field.safe) throw new Error("Session strictShape must be an own enumerable data field when present");
  if (!field.present) return false;
  if (typeof field.value !== "boolean") throw new TypeError("Session strictShape must be boolean");
  return field.value;
}

function sessionArrayKind(value, label, strictShape) {
  try {
    return Array.isArray(value);
  } catch {
    if (strictShape) throw new Error(`${label} array kind must be inspectable`);
    return null;
  }
}

function captureSessionDataProperty(receiver, key, label, required = false) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    if (required) throw new TypeError(`${label} receiver is unavailable`);
    return null;
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_SESSION_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
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
  if (current) throw new TypeError(`${label} exceeds the prototype inspection limit`);
  if (required) throw new TypeError(`${label} is unavailable`);
  return null;
}

function captureSessionMethod(receiver, key, label) {
  const callback = captureSessionDataProperty(receiver, key, label, true);
  if (typeof callback !== "function") throw new TypeError(`${label} must be a data function`);
  return (...args) => Reflect.apply(callback, receiver, args);
}

function captureSessionStorage(api) {
  const storage = captureSessionDataProperty(api, "storage", "Session storage namespace", false);
  if (storage == null) return null;
  if (typeof storage !== "object" && typeof storage !== "function") {
    throw new TypeError("Session storage namespace is invalid");
  }
  const area = captureSessionDataProperty(storage, "session", "Session storage.session namespace", false);
  if (area == null) return null;
  if (typeof area !== "object" && typeof area !== "function") {
    throw new TypeError("Session storage.session namespace is invalid");
  }
  return Object.freeze({
    get: captureSessionMethod(area, "get", "Session storage.session.get"),
    set: captureSessionMethod(area, "set", "Session storage.session.set")
  });
}

export function normalizeSessionState(stored, options = {}) {
  const strictShape = strictShapeOption(options);
  if (!stored || typeof stored !== "object") {
    if (strictShape) throw new Error("Session state must be an object");
    return cloneDefaultSessionState();
  }
  const storedIsArray = sessionArrayKind(stored, "Session state", strictShape);
  if (storedIsArray == null) return cloneDefaultSessionState();
  if (storedIsArray) {
    if (strictShape) throw new Error("Session state must be an object");
    return cloneDefaultSessionState();
  }

  assertPlainExactObject(stored, "Session state", SESSION_STATE_KEYS);
  const disabledSitesField = readPlainDataField(stored, "disabledSites");
  if (!disabledSitesField.safe) throw new Error("Session disabledSites must be an own enumerable data field when present");
  if (!disabledSitesField.present || disabledSitesField.value == null) return cloneDefaultSessionState();
  const disabledSitesIsArray = sessionArrayKind(disabledSitesField.value, "Session disabledSites", strictShape);
  if (disabledSitesIsArray == null) return cloneDefaultSessionState();
  if (!disabledSitesIsArray) {
    if (strictShape) throw new Error("Session disabledSites must be an array");
    return cloneDefaultSessionState();
  }
  const disabledSites = snapshotDenseDataArray(
    disabledSitesField.value,
    "Session disabledSites",
    LIVE_STATE_LIMITS.domains
  );
  return Object.freeze({ disabledSites: normalizeDomainSet(disabledSites) });
}

function writableSessionStateSnapshot(state) {
  assertPlainExactObject(state, "Writable session state", SESSION_STATE_KEYS);
  const field = readPlainDataField(state, "disabledSites");
  if (!field.safe || !field.present) {
    throw new Error("Writable session state requires an own enumerable disabledSites data field");
  }
  if (field.value == null) throw new Error("Writable session state disabledSites must be an array");
  const disabledSites = snapshotDenseDataArray(
    field.value,
    "Writable session state disabledSites",
    LIVE_STATE_LIMITS.domains
  );
  for (const candidate of disabledSites) normalizeDomain(candidate);
  return normalizeSessionState({ disabledSites }, { strictShape: true });
}

function sessionPauseSnapshot(state, domain, paused) {
  const current = writableSessionStateSnapshot(state);
  return Object.freeze({ disabledSites: setSiteDisabled(current.disabledSites, domain, paused) });
}

export async function loadSessionState(api) {
  const storage = captureSessionStorage(api);
  if (!storage) return cloneDefaultSessionState();
  const result = await storage.get(SESSION_STORAGE_KEY);
  const stored = sessionStorageValue(result);
  if (stored === undefined) return cloneDefaultSessionState();
  return normalizeSessionState(stored, { strictShape: true });
}

export async function saveSessionState(api, state) {
  const storage = captureSessionStorage(api);
  if (!storage) throw new Error("Session storage is unavailable in this browser");
  const normalized = writableSessionStateSnapshot(state);
  await storage.set(sessionStorageWritePayload(normalized));
  return normalized;
}

export async function setSessionSitePaused(api, domain, paused) {
  if (typeof paused !== "boolean") throw new TypeError("Session pause state must be boolean");
  const state = await loadSessionState(api);
  return saveSessionState(api, sessionPauseSnapshot(state, domain, paused));
}
