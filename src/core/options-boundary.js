import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { MAX_NETWORK_RULE_VALUE_CHARS, normalizeRule } from "./rules.js";
import { MAX_SUBSCRIPTION_ID_CHARS, isSubscriptionTitleTextSafe } from "./subscriptions.js";

export const MAX_SETTINGS_RUNTIME_ERROR_CHARS = 1_024;
export const MAX_SETTINGS_GENERIC_RESULT_FIELDS = 32;
export const MAX_SETTINGS_GENERIC_RESULT_ARRAY_LENGTH = 128;
export const MAX_SETTINGS_GENERIC_RESULT_DEPTH = 8;
export const MAX_SETTINGS_GENERIC_RESULT_NODES = 512;
export const MAX_SETTINGS_GENERIC_RESULT_STRING_CHARS = MAX_NETWORK_RULE_VALUE_CHARS;
export const MAX_SETTINGS_GENERIC_RESULT_KEY_CHARS = 256;
export const MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH = 8;

const RUNTIME_RESPONSE_KEYS = new Set(["ok", "result", "error"]);
const SIMPLE_RESPONSE_KEYS = new Set(["ok", "error"]);
const SUBSCRIPTION_RESPONSE_KEYS = new Set(["ok", "subscription", "error"]);
const SUBSCRIPTION_RESULT_KEYS = new Set(["id", "title", "enabled", "source"]);
const REFRESH_RESPONSE_KEYS = new Set(["ok", "status", "error"]);
const IMPORT_RESPONSE_KEYS = new Set(["ok", "subscriptions", "fetchedSources", "error"]);
const PERSONAL_RULE_RESULT_KEYS = new Set(["field", "changed", "rule", "communitySubmission"]);
const PERSONAL_RULE_FIELDS = new Set(["personalBlock", "personalAllow"]);
const COMMUNITY_SUBMISSION_STATUSES = new Set(["not-requested", "not-eligible", "prepared", "failed"]);
const REFRESH_STATUSES = new Set(["updated", "updated-with-fallback", "fallback", "current"]);
const SUBSCRIPTION_SOURCES = new Set(["unchanged", "cache", "none", "bundled", "fetched"]);
const UNSAFE_GENERIC_RESULT_KEY_TEXT = /[\u0000-\u001f\u007f\u2028\u2029]/;
const MAX_SETTINGS_SUBSCRIPTIONS = 128;
const MAX_IMPORT_FETCHED_SOURCES = 16;

function requiredBooleanField(value, key, label) {
  const field = readPlainDataField(value, key);
  if (!field.safe || !field.present || typeof field.value !== "boolean") {
    throw new TypeError(`${label}.${key} must be boolean`);
  }
  return field.value;
}

function optionalField(value, key, label) {
  const field = readPlainDataField(value, key);
  if (!field.safe) throw new TypeError(`${label}.${key} must be an own enumerable data field when present`);
  return field;
}

function settingsFallbackMessage(fallback, label) {
  if (typeof fallback !== "string" || !fallback || fallback.length > MAX_SETTINGS_RUNTIME_ERROR_CHARS) {
    throw new TypeError(`${label} fallback must be a non-empty string of at most ${MAX_SETTINGS_RUNTIME_ERROR_CHARS} characters`);
  }
  return fallback;
}

export function optionsCaughtErrorMessage(error, fallback) {
  const label = "Settings caught error";
  const safeFallback = settingsFallbackMessage(fallback, label);
  if (!error || (typeof error !== "object" && typeof error !== "function")) return safeFallback;
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(error, "message");
  } catch {
    return safeFallback;
  }
  if (!descriptor || !("value" in descriptor)) return safeFallback;
  return typeof descriptor.value === "string"
    && descriptor.value.length > 0
    && descriptor.value.length <= MAX_SETTINGS_RUNTIME_ERROR_CHARS
    ? descriptor.value
    : safeFallback;
}

function settingsFailureMessage(errorField, fallback, label) {
  const safeFallback = settingsFallbackMessage(fallback, label);
  return errorField.present
    && typeof errorField.value === "string"
    && errorField.value.length > 0
    && errorField.value.length <= MAX_SETTINGS_RUNTIME_ERROR_CHARS
    ? errorField.value
    : safeFallback;
}

function requireActionOutcome(response, fallback, label, successKeys) {
  const ok = requiredBooleanField(response, "ok", label);
  const error = optionalField(response, "error", label);
  const fields = new Map();
  for (const key of successKeys) fields.set(key, optionalField(response, key, label));
  if (ok) {
    if (error.present) throw new TypeError(`${label} success must not contain error`);
    return fields;
  }
  for (const [key, field] of fields) {
    if (field.present) throw new TypeError(`${label} failure must not contain ${key}`);
  }
  throw new Error(settingsFailureMessage(error, fallback, label));
}

function countGenericResultNode(context, label) {
  context.nodes += 1;
  if (context.nodes > MAX_SETTINGS_GENERIC_RESULT_NODES) {
    throw new TypeError(`${label} exceeds ${MAX_SETTINGS_GENERIC_RESULT_NODES} values`);
  }
}

function settingsArrayKind(value, label) {
  try {
    return Array.isArray(value);
  } catch {
    throw new TypeError(`${label} array kind is not safely inspectable`);
  }
}

function assertGenericResultKey(key, label) {
  if (key.length > MAX_SETTINGS_GENERIC_RESULT_KEY_CHARS || UNSAFE_GENERIC_RESULT_KEY_TEXT.test(key)) {
    throw new TypeError(`${label} contains an invalid field name`);
  }
  return key;
}

function snapshotGenericValue(value, label, context, depth) {
  if (value === null || typeof value === "boolean") {
    countGenericResultNode(context, label);
    return value;
  }
  if (typeof value === "string") {
    countGenericResultNode(context, label);
    if (value.length > MAX_SETTINGS_GENERIC_RESULT_STRING_CHARS) {
      throw new TypeError(`${label} string exceeds ${MAX_SETTINGS_GENERIC_RESULT_STRING_CHARS} characters`);
    }
    return value;
  }
  if (typeof value === "number") {
    countGenericResultNode(context, label);
    if (!Number.isFinite(value)) throw new TypeError(`${label} must contain only finite numbers`);
    return value;
  }
  if (!value || typeof value !== "object") {
    throw new TypeError(`${label} must contain only JSON-like data`);
  }
  if (depth > MAX_SETTINGS_GENERIC_RESULT_DEPTH) {
    throw new TypeError(`${label} exceeds maximum depth ${MAX_SETTINGS_GENERIC_RESULT_DEPTH}`);
  }

  countGenericResultNode(context, label);
  if (context.ancestors.has(value)) throw new TypeError(`${label} must not contain cycles`);
  context.ancestors.add(value);
  try {
    if (settingsArrayKind(value, label)) {
      const items = snapshotDenseDataArray(value, label, MAX_SETTINGS_GENERIC_RESULT_ARRAY_LENGTH);
      return Object.freeze(items.map((item, index) => snapshotGenericValue(item, `${label}[${index}]`, context, depth + 1)));
    }

    let prototype;
    let keys;
    try {
      prototype = Object.getPrototypeOf(value);
      keys = Reflect.ownKeys(value);
    } catch {
      throw new TypeError(`${label} must be a plain own-data object`);
    }
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain own-data object`);
    if (keys.length > MAX_SETTINGS_GENERIC_RESULT_FIELDS) throw new TypeError(`${label} has too many fields`);
    if (keys.some((key) => typeof key !== "string")) throw new TypeError(`${label} must not contain symbol fields`);

    const snapshot = Object.create(null);
    for (const key of keys) {
      assertGenericResultKey(key, label);
      const field = readPlainDataField(value, key);
      if (!field.safe || !field.present) throw new TypeError(`${label} contains a non-data field`);
      snapshot[key] = snapshotGenericValue(field.value, `${label}.${key}`, context, depth + 1);
    }
    return Object.freeze(snapshot);
  } finally {
    context.ancestors.delete(value);
  }
}

function snapshotGenericResult(value, label) {
  if (settingsArrayKind(value, label)) throw new TypeError(`${label} must not be an array`);
  return snapshotGenericValue(value, label, { nodes: 0, ancestors: new WeakSet() }, 0);
}

function snapshotPersonalRuleResult(result) {
  const label = "Settings personal-rule result";
  assertPlainExactObject(result, label, PERSONAL_RULE_RESULT_KEYS);
  const field = optionalField(result, "field", label);
  const changed = optionalField(result, "changed", label);
  const rule = optionalField(result, "rule", label);
  const communitySubmission = optionalField(result, "communitySubmission", label);

  if (!field.present || typeof field.value !== "string" || !PERSONAL_RULE_FIELDS.has(field.value)) {
    throw new TypeError(`${label}.field is invalid`);
  }
  if (!changed.present || typeof changed.value !== "boolean") throw new TypeError(`${label}.changed must be boolean`);
  if (!rule.present) throw new TypeError(`${label}.rule is required`);
  if (!communitySubmission.present || typeof communitySubmission.value !== "string" || !COMMUNITY_SUBMISSION_STATUSES.has(communitySubmission.value)) {
    throw new TypeError(`${label}.communitySubmission is invalid`);
  }
  if (!changed.value) {
    if (rule.value !== null) throw new TypeError(`${label}.rule must be null when changed is false`);
    if (communitySubmission.value !== "not-requested") {
      throw new TypeError(`${label}.communitySubmission must be not-requested when changed is false`);
    }
  } else {
    if (rule.value == null) throw new TypeError(`${label}.rule must be non-null when changed is true`);
    try {
      normalizeRule(rule.value);
    } catch {
      throw new TypeError(`${label}.rule must be a valid network rule when changed is true`);
    }
  }
  if (field.value === "personalAllow" && communitySubmission.value !== "not-requested") {
    throw new TypeError(`${label}.communitySubmission must be not-requested for personalAllow`);
  }
  return Object.freeze({ communitySubmission: communitySubmission.value });
}

export function unwrapOptionsRuntimeResponse(response, fallback) {
  const label = "Settings runtime response";
  assertPlainExactObject(response, label, RUNTIME_RESPONSE_KEYS);
  const ok = requiredBooleanField(response, "ok", label);
  const result = optionalField(response, "result", label);
  const error = optionalField(response, "error", label);
  if (ok) {
    if (error.present) throw new TypeError(`${label} success must not contain error`);
  } else {
    if (result.present) throw new TypeError(`${label} failure must not contain result`);
    throw new Error(settingsFailureMessage(error, fallback, label));
  }
  if (!result.present) return undefined;
  const snapshot = snapshotGenericResult(result.value, `${label}.result`);
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) && Object.hasOwn(snapshot, "communitySubmission")) {
    return snapshotPersonalRuleResult(snapshot);
  }
  return snapshot;
}

export function unwrapOptionsSimpleResponse(response, fallback) {
  const label = "Settings simple response";
  assertPlainExactObject(response, label, SIMPLE_RESPONSE_KEYS);
  requireActionOutcome(response, fallback, label, []);
  return true;
}

export function unwrapOptionsSubscriptionResponse(response, fallback) {
  const label = "Settings subscription response";
  assertPlainExactObject(response, label, SUBSCRIPTION_RESPONSE_KEYS);
  const outcome = requireActionOutcome(response, fallback, label, ["subscription"]);
  const subscriptionField = outcome.get("subscription");
  if (!subscriptionField.present) throw new TypeError(`${label}.subscription is required on success`);

  const subscription = subscriptionField.value;
  assertPlainExactObject(subscription, `${label}.subscription`, SUBSCRIPTION_RESULT_KEYS);
  const id = optionalField(subscription, "id", `${label}.subscription`);
  const title = optionalField(subscription, "title", `${label}.subscription`);
  const enabled = optionalField(subscription, "enabled", `${label}.subscription`);
  const source = optionalField(subscription, "source", `${label}.subscription`);

  if (!id.present || typeof id.value !== "string" || id.value.length > MAX_SUBSCRIPTION_ID_CHARS || !/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(id.value)) {
    throw new TypeError(`${label}.subscription.id is invalid`);
  }
  if (title.present && !isSubscriptionTitleTextSafe(title.value)) {
    throw new TypeError(`${label}.subscription.title is invalid`);
  }
  if (enabled.present && typeof enabled.value !== "boolean") throw new TypeError(`${label}.subscription.enabled must be boolean`);
  if (source.present && (typeof source.value !== "string" || !SUBSCRIPTION_SOURCES.has(source.value))) {
    throw new TypeError(`${label}.subscription.source is invalid`);
  }

  return Object.freeze({
    id: id.value,
    ...(title.present ? { title: title.value } : {}),
    ...(enabled.present ? { enabled: enabled.value } : {}),
    ...(source.present ? { source: source.value } : {})
  });
}

export function unwrapOptionsRefreshResponse(response, fallback) {
  const label = "Settings refresh response";
  assertPlainExactObject(response, label, REFRESH_RESPONSE_KEYS);
  const outcome = requireActionOutcome(response, fallback, label, ["status"]);
  const status = outcome.get("status");
  if (!status.present || typeof status.value !== "string" || !REFRESH_STATUSES.has(status.value)) {
    throw new TypeError(`${label}.status is invalid`);
  }
  return status.value;
}

export function unwrapOptionsImportResponse(response, fallback) {
  const label = "Settings import response";
  assertPlainExactObject(response, label, IMPORT_RESPONSE_KEYS);
  const outcome = requireActionOutcome(response, fallback, label, ["subscriptions", "fetchedSources"]);
  const subscriptions = outcome.get("subscriptions");
  const fetchedSources = outcome.get("fetchedSources");
  if (!subscriptions.present || !Number.isSafeInteger(subscriptions.value) || subscriptions.value < 0 || subscriptions.value > MAX_SETTINGS_SUBSCRIPTIONS) {
    throw new TypeError(`${label}.subscriptions must be a safe integer from 0 through ${MAX_SETTINGS_SUBSCRIPTIONS}`);
  }
  if (!fetchedSources.present || !Number.isSafeInteger(fetchedSources.value) || fetchedSources.value < 0 || fetchedSources.value > MAX_IMPORT_FETCHED_SOURCES) {
    throw new TypeError(`${label}.fetchedSources must be a safe integer from 0 through ${MAX_IMPORT_FETCHED_SOURCES}`);
  }
  return Object.freeze({ subscriptions: subscriptions.value, fetchedSources: fetchedSources.value });
}

export function isRelevantOptionsStorageChange(changes, areaName, storageKey) {
  if (areaName !== "local" || typeof storageKey !== "string" || !storageKey) return false;
  const field = readPlainDataField(changes, storageKey);
  return field.safe && field.present;
}

function captureSettingsCollaboratorValue(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
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

export function installOptionsStorageListener(api, listener) {
  if (typeof listener !== "function") throw new TypeError("Settings storage listener must be a function");
  const storage = captureSettingsCollaboratorValue(api, "storage", "Settings storage namespace");
  const onChanged = captureSettingsCollaboratorValue(storage, "onChanged", "Settings storage.onChanged event");
  const addListener = captureSettingsCollaboratorValue(onChanged, "addListener", "Settings storage.onChanged.addListener");
  if (typeof addListener !== "function") throw new TypeError("Settings storage.onChanged.addListener must be a data function");
  Reflect.apply(addListener, onChanged, [listener]);
  return true;
}
