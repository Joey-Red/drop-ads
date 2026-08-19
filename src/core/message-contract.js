import {
  MAX_COSMETIC_DOMAINS,
  MAX_COSMETIC_RULE_KEY_CHARS,
  MAX_COSMETIC_SELECTOR_LENGTH,
  normalizeCosmeticRule,
  parseCosmeticRuleKey
} from "./cosmetic-rules.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import {
  MAX_CANONICAL_DOMAIN_CHARS,
  MAX_NETWORK_RULE_KEY_CHARS,
  MAX_NETWORK_RULE_RESOURCE_TYPES,
  MAX_NETWORK_RULE_VALUE_CHARS,
  normalizeDomain,
  normalizeRule,
  parseRuleKey
} from "./rules.js";
import { MAX_SETTINGS_BACKUP_BYTES } from "./settings-backup.js";
import {
  MAX_SUBSCRIPTION_ID_CHARS,
  MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS,
  MAX_SUBSCRIPTION_TITLE_CHARS,
  normalizeSubscription
} from "./subscriptions.js";

export const MAX_RUNTIME_RULE_VALUE_CHARS = MAX_NETWORK_RULE_VALUE_CHARS;
export const MAX_RUNTIME_RULE_KEY_CHARS = MAX_NETWORK_RULE_KEY_CHARS;
export const MAX_RUNTIME_RULE_RESOURCE_TYPES = MAX_NETWORK_RULE_RESOURCE_TYPES;
export const MAX_RUNTIME_COSMETIC_KEY_CHARS = MAX_COSMETIC_RULE_KEY_CHARS;
export const MAX_RUNTIME_MESSAGE_ERROR_CHARS = 1_024;
export const MAX_RUNTIME_MESSAGE_TYPE_CHARS = 64;

const CORE_TYPES = new Set([
  "drop-ads:get-ui-state",
  "drop-ads:refresh-lists",
  "drop-ads:add-subscription",
  "drop-ads:set-subscription-enabled",
  "drop-ads:remove-subscription",
  "drop-ads:set-enabled",
  "drop-ads:add-personal-rule",
  "drop-ads:remove-personal-rule",
  "drop-ads:set-cookie-mode",
  "drop-ads:set-cookie-exception",
  "drop-ads:set-site-disabled",
  "drop-ads:set-session-site-paused",
  "drop-ads:import-settings",
  "drop-ads:submit-community"
]);
const COSMETIC_TYPES = new Set([
  "drop-ads:get-cosmetic-policy",
  "drop-ads:add-cosmetic-rule",
  "drop-ads:remove-cosmetic-rule"
]);
const ALL_BACKGROUND_TYPES = new Set([...CORE_TYPES, ...COSMETIC_TYPES]);
const PERSONAL_FIELDS = new Set(["personalBlock", "personalAllow"]);
const COSMETIC_FIELDS = new Set(["personalCosmeticHide", "personalCosmeticAllow"]);
const COOKIE_MODES = new Set(["off", "third-party", "all"]);
const MESSAGE_ENVELOPE_KEYS = new Set([
  "type", "force", "subscription", "id", "enabled", "field", "rule", "key",
  "cookieMode", "domain", "allowed", "disabled", "paused", "backupText"
]);
const MESSAGE_GUARD_OPTION_KEYS = new Set(["group", "rejectUnknown"]);
const MAX_MESSAGE_GUARD_COLLABORATOR_PROTOTYPE_DEPTH = 8;
const INVALID_RUNTIME_MESSAGE_PREFIX = "Invalid runtime message: ";
const INVALID_RUNTIME_MESSAGE_FALLBACK = "validation failed";
const MAX_RUNTIME_MESSAGE_ERROR_DETAIL_CHARS = MAX_RUNTIME_MESSAGE_ERROR_CHARS - INVALID_RUNTIME_MESSAGE_PREFIX.length;

function exactDataSnapshot(value, required, optional = [], label = "Runtime payload") {
  const allowed = new Set([...required, ...optional]);
  assertPlainExactObject(value, label, allowed);
  const snapshot = Object.create(null);
  for (const key of allowed) {
    const field = readPlainDataField(value, key);
    if (!field.safe) throw new Error(`${label}.${key} must be an own enumerable data field when present`);
    if (required.includes(key) && !field.present) throw new Error(`${label} is missing field: ${key}`);
    if (field.present) snapshot[key] = field.value;
  }
  return snapshot;
}

function assertExactKeys(value, required, optional = [], label = "Runtime message") {
  const allowed = new Set([...required, ...optional]);
  assertPlainExactObject(value, label, allowed);
  for (const key of required) if (!Object.hasOwn(value, key)) throw new Error(`${label} is missing field: ${key}`);
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") throw new Error(`${label} must be boolean`);
}

function assertString(value, label, maxChars) {
  if (typeof value !== "string" || !value) throw new Error(`${label} must be a non-empty string`);
  if (value.length > maxChars) throw new Error(`${label} exceeds ${maxChars} characters`);
  return value;
}

function assertDomain(value) {
  assertString(value, "domain", MAX_CANONICAL_DOMAIN_CHARS);
  normalizeDomain(value);
}

function assertPersonalRule(rule) {
  const snapshot = exactDataSnapshot(rule, ["kind", "value"], ["resourceTypes"], "Runtime rule");
  assertString(snapshot.value, "rule.value", MAX_NETWORK_RULE_VALUE_CHARS);
  if (Object.hasOwn(snapshot, "resourceTypes")) {
    const resourceTypes = snapshotDenseDataArray(snapshot.resourceTypes, "Runtime rule.resourceTypes", MAX_NETWORK_RULE_RESOURCE_TYPES);
    if (resourceTypes.length < 1) throw new Error("rule.resourceTypes is invalid");
    if (resourceTypes.some((value) => typeof value !== "string" || value.length > 32)) throw new Error("rule.resourceTypes contains an invalid value");
    snapshot.resourceTypes = resourceTypes;
  }
  normalizeRule(snapshot);
  return snapshot;
}

function assertCosmeticRule(rule) {
  const snapshot = exactDataSnapshot(rule, ["selector"], ["domains", "excludedDomains"], "Runtime cosmetic rule");
  assertString(snapshot.selector, "cosmetic selector", MAX_COSMETIC_SELECTOR_LENGTH);
  for (const key of ["domains", "excludedDomains"]) {
    if (!Object.hasOwn(snapshot, key)) continue;
    snapshot[key] = snapshotDenseDataArray(snapshot[key], `Runtime cosmetic rule.${key}`, MAX_COSMETIC_DOMAINS);
  }
  normalizeCosmeticRule(snapshot);
  return snapshot;
}

function assertSubscription(subscription) {
  const snapshot = exactDataSnapshot(
    subscription,
    ["id", "title", "format", "sourceUrl"],
    ["enabled", "builtIn"],
    "Runtime subscription"
  );
  assertString(snapshot.id, "subscription.id", MAX_SUBSCRIPTION_ID_CHARS);
  assertString(snapshot.title, "subscription.title", MAX_SUBSCRIPTION_TITLE_CHARS);
  assertString(snapshot.sourceUrl, "subscription.sourceUrl", MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS);
  if (Object.hasOwn(snapshot, "enabled")) assertBoolean(snapshot.enabled, "subscription.enabled");
  if (Object.hasOwn(snapshot, "builtIn")) assertBoolean(snapshot.builtIn, "subscription.builtIn");
  normalizeSubscription(snapshot);
  return snapshot;
}

function assertBackupText(value) {
  if (typeof value !== "string") throw new Error("backupText must be a string");
  if (value.length > MAX_SETTINGS_BACKUP_BYTES) throw new Error(`backupText exceeds ${MAX_SETTINGS_BACKUP_BYTES} UTF-8 bytes`);
  const bytes = new TextEncoder().encode(value).byteLength;
  if (bytes > MAX_SETTINGS_BACKUP_BYTES) throw new Error(`backupText exceeds ${MAX_SETTINGS_BACKUP_BYTES} UTF-8 bytes`);
}

function guardedErrorDetail(error) {
  if ((typeof error !== "object" || error === null) && typeof error !== "function") return INVALID_RUNTIME_MESSAGE_FALLBACK;
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(error, "message");
  } catch {
    return INVALID_RUNTIME_MESSAGE_FALLBACK;
  }
  if (!descriptor || !("value" in descriptor)) return INVALID_RUNTIME_MESSAGE_FALLBACK;
  const message = descriptor.value;
  if (typeof message !== "string" || !message || message.length > MAX_RUNTIME_MESSAGE_ERROR_DETAIL_CHARS) {
    return INVALID_RUNTIME_MESSAGE_FALLBACK;
  }
  return message;
}

function guardedErrorText(error) {
  const text = `${INVALID_RUNTIME_MESSAGE_PREFIX}${guardedErrorDetail(error)}`;
  return text.length <= MAX_RUNTIME_MESSAGE_ERROR_CHARS
    ? text
    : `${INVALID_RUNTIME_MESSAGE_PREFIX}${INVALID_RUNTIME_MESSAGE_FALLBACK}`;
}

function validateKnownMessage(message) {
  const type = message.type;
  switch (type) {
    case "drop-ads:get-ui-state":
    case "drop-ads:get-cosmetic-policy":
      assertExactKeys(message, ["type"]);
      break;
    case "drop-ads:refresh-lists":
      assertExactKeys(message, ["type"], ["force"]);
      if (Object.hasOwn(message, "force")) assertBoolean(message.force, "force");
      break;
    case "drop-ads:add-subscription":
      assertExactKeys(message, ["type", "subscription"]);
      message.subscription = assertSubscription(message.subscription);
      break;
    case "drop-ads:set-subscription-enabled":
      assertExactKeys(message, ["type", "id", "enabled"]);
      assertString(message.id, "id", MAX_SUBSCRIPTION_ID_CHARS);
      assertBoolean(message.enabled, "enabled");
      break;
    case "drop-ads:remove-subscription":
      assertExactKeys(message, ["type", "id"]);
      assertString(message.id, "id", MAX_SUBSCRIPTION_ID_CHARS);
      break;
    case "drop-ads:set-enabled":
      assertExactKeys(message, ["type", "enabled"]);
      assertBoolean(message.enabled, "enabled");
      break;
    case "drop-ads:add-personal-rule":
      assertExactKeys(message, ["type", "field", "rule"]);
      if (!PERSONAL_FIELDS.has(message.field)) throw new Error("field is invalid");
      message.rule = assertPersonalRule(message.rule);
      break;
    case "drop-ads:remove-personal-rule":
      assertExactKeys(message, ["type", "field", "key"]);
      if (!PERSONAL_FIELDS.has(message.field)) throw new Error("field is invalid");
      assertString(message.key, "key", MAX_RUNTIME_RULE_KEY_CHARS);
      parseRuleKey(message.key);
      break;
    case "drop-ads:set-cookie-mode":
      assertExactKeys(message, ["type", "cookieMode"]);
      if (!COOKIE_MODES.has(message.cookieMode)) throw new Error("cookieMode is invalid");
      break;
    case "drop-ads:set-cookie-exception":
      assertExactKeys(message, ["type", "domain", "allowed"]);
      assertDomain(message.domain);
      assertBoolean(message.allowed, "allowed");
      break;
    case "drop-ads:set-site-disabled":
      assertExactKeys(message, ["type", "domain", "disabled"]);
      assertDomain(message.domain);
      assertBoolean(message.disabled, "disabled");
      break;
    case "drop-ads:set-session-site-paused":
      assertExactKeys(message, ["type", "domain", "paused"]);
      assertDomain(message.domain);
      assertBoolean(message.paused, "paused");
      break;
    case "drop-ads:import-settings":
      assertExactKeys(message, ["type", "backupText"]);
      assertBackupText(message.backupText);
      break;
    case "drop-ads:submit-community":
      assertExactKeys(message, ["type", "rule"]);
      message.rule = assertPersonalRule(message.rule);
      break;
    case "drop-ads:add-cosmetic-rule":
      assertExactKeys(message, ["type", "field", "rule"]);
      if (!COSMETIC_FIELDS.has(message.field)) throw new Error("field is invalid");
      message.rule = assertCosmeticRule(message.rule);
      break;
    case "drop-ads:remove-cosmetic-rule":
      assertExactKeys(message, ["type", "field", "key"]);
      if (!COSMETIC_FIELDS.has(message.field)) throw new Error("field is invalid");
      assertString(message.key, "key", MAX_RUNTIME_COSMETIC_KEY_CHARS);
      parseCosmeticRuleKey(message.key);
      break;
    default:
      throw new Error("Unknown Drop Ads runtime message type");
  }
}

function runtimeMessageSnapshot(message) {
  assertPlainExactObject(message, "Runtime message", MESSAGE_ENVELOPE_KEYS);
  const snapshot = Object.create(null);
  for (const key of MESSAGE_ENVELOPE_KEYS) {
    const field = readPlainDataField(message, key);
    if (!field.safe) throw new Error(`Runtime message.${key} must remain an own enumerable data field when present`);
    if (field.present) snapshot[key] = field.value;
  }
  return snapshot;
}

function safeMessageType(message) {
  const field = readPlainDataField(message, "type");
  if (!field.safe || !field.present || typeof field.value !== "string") return null;
  if (!field.value || field.value.length > MAX_RUNTIME_MESSAGE_TYPE_CHARS) return null;
  return field.value;
}

function assertMessageGroup(group) {
  if (group !== "core" && group !== "cosmetic") throw new Error("Message guard group is invalid");
  return group;
}

function captureMessageGuardValue(receiver, key, label, required = true) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    if (!required) return null;
    throw new TypeError(`${label} receiver is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_MESSAGE_GUARD_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
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
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

function captureMessageGuardMethod(receiver, key, label, required = true) {
  const callback = captureMessageGuardValue(receiver, key, label, required);
  if (callback === null && !required) return null;
  if (typeof callback !== "function") throw new TypeError(`${label} must be a data function`);
  return (...args) => Reflect.apply(callback, receiver, args);
}

function validateRuntimeMessageSnapshot(message, group) {
  const snapshot = runtimeMessageSnapshot(message);
  if (!Object.hasOwn(snapshot, "type") || typeof snapshot.type !== "string" || !snapshot.type) throw new Error("Runtime message type is required");
  if (snapshot.type.length > MAX_RUNTIME_MESSAGE_TYPE_CHARS) throw new Error("Runtime message type is invalid");
  if (!ALL_BACKGROUND_TYPES.has(snapshot.type)) throw new Error("Unknown Drop Ads runtime message type");
  const belongs = group === "core" ? CORE_TYPES.has(snapshot.type) : COSMETIC_TYPES.has(snapshot.type);
  if (!belongs) return { handled: false, type: snapshot.type, message: null };
  validateKnownMessage(snapshot);
  return { handled: true, type: snapshot.type, message: snapshot };
}

export function validateBackgroundRuntimeMessage(message, group) {
  const validatedGroup = assertMessageGroup(group);
  const decision = validateRuntimeMessageSnapshot(message, validatedGroup);
  return { handled: decision.handled, type: decision.type };
}

export function createMessageGuardedApi(api, options = {}) {
  const optionSnapshot = exactDataSnapshot(options, ["group"], ["rejectUnknown"], "Message guard options");
  const group = assertMessageGroup(optionSnapshot.group);
  const rejectUnknown = Object.hasOwn(optionSnapshot, "rejectUnknown") ? optionSnapshot.rejectUnknown : group === "core";
  if (typeof rejectUnknown !== "boolean") throw new TypeError("Message guard rejectUnknown must be boolean");
  const rawRuntime = captureMessageGuardValue(api, "runtime", "Message guard runtime namespace");
  const rawOnMessage = captureMessageGuardValue(rawRuntime, "onMessage", "Message guard runtime.onMessage event");
  const addMessageListener = captureMessageGuardMethod(rawOnMessage, "addListener", "Message guard runtime.onMessage.addListener");
  const removeMessageListener = captureMessageGuardMethod(rawOnMessage, "removeListener", "Message guard runtime.onMessage.removeListener", false);

  const wrappers = new Map();

  function makeWrapper(listener) {
    let wrapper;
    wrapper = (message, sender, sendResponse) => {
      if (wrappers.get(listener) !== wrapper) return false;
      let decision;
      try {
        decision = validateRuntimeMessageSnapshot(message, group);
      } catch (error) {
        const type = safeMessageType(message);
        const knownOtherGroup = type && ALL_BACKGROUND_TYPES.has(type)
          && (group === "core" ? COSMETIC_TYPES.has(type) : CORE_TYPES.has(type));
        if (knownOtherGroup || !rejectUnknown) return false;
        try {
          sendResponse({ ok: false, error: guardedErrorText(error) });
        } catch {
          // A closed/hostile response channel must not escape the guard wrapper.
        }
        return true;
      }
      if (!decision.handled) return false;
      return listener(decision.message, sender, sendResponse);
    };
    return wrapper;
  }

  const guardedOnMessage = Object.freeze({
    addListener(listener) {
      if (typeof listener !== "function") throw new TypeError("Runtime message listener must be a function");
      if (wrappers.has(listener)) return;
      const wrapper = makeWrapper(listener);
      wrappers.set(listener, wrapper);
      try {
        addMessageListener(wrapper);
      } catch (error) {
        if (wrappers.get(listener) === wrapper) wrappers.delete(listener);
        throw error;
      }
    },
    removeListener(listener) {
      const wrapper = wrappers.get(listener);
      if (!wrapper) return;
      wrappers.delete(listener);
      try {
        removeMessageListener?.(wrapper);
      } catch {
        // Logical removal wins. A browser-retained wrapper is inert because its identity was released first.
      }
    },
    hasListener(listener) {
      return wrappers.has(listener);
    }
  });

  const guardedRuntime = new Proxy(rawRuntime, {
    get(target, property, receiver) {
      if (property === "onMessage") return guardedOnMessage;
      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? (...args) => Reflect.apply(value, target, args) : value;
    }
  });

  return new Proxy(api, {
    get(target, property, receiver) {
      if (property === "runtime") return guardedRuntime;
      return Reflect.get(target, property, receiver);
    }
  });
}
