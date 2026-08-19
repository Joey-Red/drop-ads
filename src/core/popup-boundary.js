import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { MAX_NETWORK_RULE_VALUE_CHARS, normalizeDomain } from "./rules.js";
import { normalizeSessionState } from "./session.js";
import { LIVE_STATE_LIMITS, snapshotPersistedState } from "./state-limits.js";

export const MAX_POPUP_ACTIVE_TAB_CANDIDATES = 16;
export const MAX_POPUP_RUNTIME_ERROR_CHARS = 1_024;
export const MAX_POPUP_ACTIVE_TAB_URL_CHARS = MAX_NETWORK_RULE_VALUE_CHARS;
export const MAX_POPUP_COLLABORATOR_PROTOTYPE_DEPTH = 8;

const RUNTIME_RESPONSE_KEYS = new Set(["ok", "result", "error"]);
const POPUP_UI_ROOT_KEYS = new Set(["state", "session"]);
const COOKIE_MODES = new Set(["off", "third-party", "all"]);
const COOKIE_BANNER_MODES = new Set(["off", "reject"]);
const UNSAFE_POPUP_ERROR_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;

function isPopupErrorTextSafe(value) {
  return typeof value === "string"
    && value.length > 0
    && value.length <= MAX_POPUP_RUNTIME_ERROR_CHARS
    && !UNSAFE_POPUP_ERROR_TEXT.test(value);
}

function popupFallbackMessage(fallback) {
  if (!isPopupErrorTextSafe(fallback)) {
    throw new TypeError(`Popup runtime fallback must be safe text of at most ${MAX_POPUP_RUNTIME_ERROR_CHARS} characters`);
  }
  return fallback;
}

export function popupCaughtErrorMessage(error, fallback) {
  const safeFallback = popupFallbackMessage(fallback);
  if (!error || (typeof error !== "object" && typeof error !== "function")) return safeFallback;
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(error, "message");
  } catch {
    return safeFallback;
  }
  if (!descriptor || !("value" in descriptor)) return safeFallback;
  return isPopupErrorTextSafe(descriptor.value) ? descriptor.value : safeFallback;
}

export function unwrapPopupRuntimeResponse(response, fallback) {
  assertPlainExactObject(response, "Popup runtime response", RUNTIME_RESPONSE_KEYS);
  const okField = readPlainDataField(response, "ok");
  if (!okField.safe || !okField.present || typeof okField.value !== "boolean") {
    throw new TypeError("Popup runtime response.ok must be boolean");
  }
  const errorField = readPlainDataField(response, "error");
  if (!errorField.safe) throw new TypeError("Popup runtime response.error must be an own enumerable data field when present");
  const resultField = readPlainDataField(response, "result");
  if (!resultField.safe) throw new TypeError("Popup runtime response.result must be an own enumerable data field when present");

  if (okField.value) {
    if (errorField.present) throw new TypeError("Popup runtime success response must not contain error");
    return resultField.present ? resultField.value : undefined;
  }
  if (resultField.present) throw new TypeError("Popup runtime failure response must not contain result");
  const safeFallback = popupFallbackMessage(fallback);
  const message = errorField.present && isPopupErrorTextSafe(errorField.value)
    ? errorField.value
    : safeFallback;
  throw new Error(message);
}

export function snapshotPopupActiveTab(tabs) {
  let candidates;
  try {
    candidates = snapshotDenseDataArray(tabs, "Popup active-tab query result", MAX_POPUP_ACTIVE_TAB_CANDIDATES);
  } catch {
    return null;
  }
  if (!candidates.length) return null;

  const tab = candidates[0];
  const idField = readPlainDataField(tab, "id");
  const urlField = readPlainDataField(tab, "url");
  if (!idField.safe || !idField.present || !Number.isSafeInteger(idField.value) || idField.value < 0) return null;
  if (!urlField.safe || !urlField.present || typeof urlField.value !== "string" || urlField.value.length > MAX_POPUP_ACTIVE_TAB_URL_CHARS) return null;
  return Object.freeze({ id: idField.value, url: urlField.value });
}

export function popupStorageChangeAffectsPolicy(changes, areaName, localKey, sessionKey) {
  if (areaName !== "local" && areaName !== "session") return false;
  const key = areaName === "local" ? localKey : sessionKey;
  if (typeof key !== "string" || !key) return false;
  const field = readPlainDataField(changes, key);
  return field.safe && field.present;
}

function capturePopupCollaboratorValue(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_POPUP_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(current, key);
    } catch {
      throw new TypeError(`${label} is not safely inspectable`);
    }
    if (descriptor) {
      if (!("value" in descriptor)) throw new TypeError(`${label} must be a data property`);
      return descriptor.value;
    }
    try {
      current = Object.getPrototypeOf(current);
    } catch {
      throw new TypeError(`${label} prototype is not safely inspectable`);
    }
  }
  throw new TypeError(`${label} is unavailable`);
}

export function installPopupStorageListener(api, listener) {
  if (typeof listener !== "function") throw new TypeError("Popup storage listener must be a function");
  const storage = capturePopupCollaboratorValue(api, "storage", "Popup storage namespace");
  const onChanged = capturePopupCollaboratorValue(storage, "onChanged", "Popup storage.onChanged event");
  const addListener = capturePopupCollaboratorValue(onChanged, "addListener", "Popup storage.onChanged.addListener");
  const removeListener = capturePopupCollaboratorValue(onChanged, "removeListener", "Popup storage.onChanged.removeListener");
  if (typeof addListener !== "function") throw new TypeError("Popup storage.onChanged.addListener must be a data function");
  if (typeof removeListener !== "function") throw new TypeError("Popup storage.onChanged.removeListener must be a data function");
  Reflect.apply(addListener, onChanged, [listener]);
  let active = true;
  return () => {
    if (!active) return false;
    active = false;
    try {
      Reflect.apply(removeListener, onChanged, [listener]);
      return true;
    } catch {
      return false;
    }
  };
}

export function queryPopupActiveTab(api) {
  const tabs = capturePopupCollaboratorValue(api, "tabs", "Popup tabs namespace");
  const query = capturePopupCollaboratorValue(tabs, "query", "Popup tabs.query");
  if (typeof query !== "function") throw new TypeError("Popup tabs.query must be a data function");
  const queryInfo = Object.freeze({ active: true, currentWindow: true });
  return Reflect.apply(query, tabs, [queryInfo]);
}

export function sendPopupRuntimeMessage(api, message) {
  const runtime = capturePopupCollaboratorValue(api, "runtime", "Popup runtime namespace");
  const sendMessage = capturePopupCollaboratorValue(runtime, "sendMessage", "Popup runtime.sendMessage");
  if (typeof sendMessage !== "function") throw new TypeError("Popup runtime.sendMessage must be a data function");
  return Reflect.apply(sendMessage, runtime, [message]);
}

export function openPopupOptionsPage(api) {
  const runtime = capturePopupCollaboratorValue(api, "runtime", "Popup runtime namespace");
  const openOptionsPage = capturePopupCollaboratorValue(runtime, "openOptionsPage", "Popup runtime.openOptionsPage");
  if (typeof openOptionsPage !== "function") throw new TypeError("Popup runtime.openOptionsPage must be a data function");
  return Reflect.apply(openOptionsPage, runtime, []);
}

export function sendPopupTopFrameMessage(api, tabId, message) {
  if (!Number.isSafeInteger(tabId) || tabId < 0) throw new TypeError("Popup tab id must be a non-negative safe integer");
  const tabs = capturePopupCollaboratorValue(api, "tabs", "Popup tabs namespace");
  const sendMessage = capturePopupCollaboratorValue(tabs, "sendMessage", "Popup tabs.sendMessage");
  if (typeof sendMessage !== "function") throw new TypeError("Popup tabs.sendMessage must be a data function");
  const options = Object.freeze({ frameId: 0 });
  return Reflect.apply(sendMessage, tabs, [tabId, message, options]);
}

function requireCanonicalDomainArray(value, label) {
  const values = snapshotDenseDataArray(value, label, LIVE_STATE_LIMITS.domains);
  const normalized = values.map((item) => {
    if (typeof item !== "string") throw new TypeError(`${label} must contain strings only`);
    let domain;
    try { domain = normalizeDomain(item); }
    catch { throw new TypeError(`${label} must contain canonical domains only`); }
    if (domain !== item) throw new TypeError(`${label} must contain canonical domains only`);
    return domain;
  });
  const canonical = [...new Set(normalized)].sort();
  if (canonical.length !== normalized.length || canonical.some((item, index) => item !== normalized[index])) {
    throw new TypeError(`${label} must be sorted and duplicate-free`);
  }
  return normalized;
}

export function snapshotPopupUiState(value) {
  assertPlainExactObject(value, "Popup UI state", POPUP_UI_ROOT_KEYS);
  const stateField = readPlainDataField(value, "state");
  const sessionField = readPlainDataField(value, "session");
  if (!stateField.safe || !stateField.present) throw new Error("Popup UI state.state is required");
  if (!sessionField.safe || !sessionField.present) throw new Error("Popup UI state.session is required");

  const state = snapshotPersistedState(stateField.value);
  const sessionDisabledSitesField = readPlainDataField(sessionField.value, "disabledSites");
  if (!sessionDisabledSitesField.safe || !sessionDisabledSitesField.present) throw new Error("Popup UI session disabledSites is required");
  const session = normalizeSessionState(sessionField.value, { strictShape: true });
  if (typeof state.enabled !== "boolean") throw new TypeError("Popup UI state enabled must be boolean");
  if (!COOKIE_MODES.has(state.cookieMode)) throw new TypeError("Popup UI state cookieMode is invalid");
  if (!COOKIE_BANNER_MODES.has(state.cookieBannerMode)) throw new TypeError("Popup UI state cookieBannerMode is invalid");
  if (!Object.hasOwn(state, "disabledSites") || !Object.hasOwn(state, "cookieAllowSites") || !Object.hasOwn(state, "cookieBannerDisabledSites")) {
    throw new Error("Popup UI state domain collections are required");
  }

  const disabledSites = requireCanonicalDomainArray(state.disabledSites, "Popup UI state disabledSites");
  const cookieAllowSites = requireCanonicalDomainArray(state.cookieAllowSites, "Popup UI state cookieAllowSites");
  const cookieBannerDisabledSites = requireCanonicalDomainArray(state.cookieBannerDisabledSites, "Popup UI state cookieBannerDisabledSites");
  const sessionDisabledSites = requireCanonicalDomainArray(sessionDisabledSitesField.value, "Popup UI session disabledSites");
  if (session.disabledSites.length !== sessionDisabledSites.length
    || session.disabledSites.some((item, index) => item !== sessionDisabledSites[index])) {
    throw new TypeError("Popup UI session disabledSites must match canonical session state");
  }
  return Object.freeze({
    state: Object.freeze({
      enabled: state.enabled,
      cookieMode: state.cookieMode,
      cookieBannerMode: state.cookieBannerMode,
      disabledSites: Object.freeze(disabledSites),
      cookieAllowSites: Object.freeze(cookieAllowSites),
      cookieBannerDisabledSites: Object.freeze(cookieBannerDisabledSites)
    }),
    session: Object.freeze({ disabledSites: Object.freeze(sessionDisabledSites) })
  });
}
