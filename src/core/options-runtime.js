import { MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH } from "./options-boundary.js";

export const MAX_SETTINGS_RUNTIME_MESSAGE_FIELDS = 8;

const ADD_SUBSCRIPTION_TYPE = "drop-ads:add-subscription";
const EXTERNAL_SUBSCRIPTION_MESSAGE_FIELDS = new Set(["id", "title", "format", "sourceUrl", "enabled", "builtIn"]);

function captureOptionsRuntimeCollaboratorValue(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
    throw new TypeError(`${label} is unavailable`);
  }
  let current = receiver;
  for (let depth = 0; current && depth <= MAX_SETTINGS_COLLABORATOR_PROTOTYPE_DEPTH; depth += 1) {
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

function snapshotOptionsRuntimeMessage(message) {
  if (!message || typeof message !== "object") throw new TypeError("Settings runtime message must be an object");
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(message);
    keys = Reflect.ownKeys(message);
  } catch {
    throw new TypeError("Settings runtime message is not safely inspectable");
  }
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Settings runtime message must be an ordinary or null-prototype object");
  }
  if (keys.length > MAX_SETTINGS_RUNTIME_MESSAGE_FIELDS) {
    throw new TypeError(`Settings runtime message exceeds ${MAX_SETTINGS_RUNTIME_MESSAGE_FIELDS} fields`);
  }

  const snapshot = Object.create(null);
  for (const key of keys) {
    if (typeof key !== "string") throw new TypeError("Settings runtime message must not contain symbol fields");
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(message, key);
    } catch {
      throw new TypeError("Settings runtime message fields are not safely inspectable");
    }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError("Settings runtime message fields must be enumerable own data properties");
    }
    snapshot[key] = descriptor.value;
  }
  return Object.freeze(snapshot);
}

function snapshotExternalSubscriptionForRuntime(subscription) {
  if (!subscription || typeof subscription !== "object") return subscription;
  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(subscription);
    keys = Reflect.ownKeys(subscription);
  } catch {
    throw new TypeError("Settings external subscription is not safely inspectable");
  }
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Settings external subscription must be an ordinary or null-prototype object");
  }
  const snapshot = Object.create(null);
  for (const key of keys) {
    if (typeof key !== "string" || !EXTERNAL_SUBSCRIPTION_MESSAGE_FIELDS.has(key)) {
      throw new TypeError("Settings external subscription contains an unsupported field");
    }
    let descriptor;
    try { descriptor = Object.getOwnPropertyDescriptor(subscription, key); }
    catch { throw new TypeError("Settings external subscription fields are not safely inspectable"); }
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError("Settings external subscription fields must be enumerable own data properties");
    }
    if (key === "builtIn") {
      if (descriptor.value !== false) throw new TypeError("Settings cannot add a built-in subscription");
      continue;
    }
    snapshot[key] = descriptor.value;
  }
  return Object.freeze(snapshot);
}

function normalizeOptionsRuntimeMessage(snapshot) {
  if (snapshot.type !== ADD_SUBSCRIPTION_TYPE || !Object.hasOwn(snapshot, "subscription")) return snapshot;
  const normalized = Object.create(null);
  for (const key of Reflect.ownKeys(snapshot)) normalized[key] = snapshot[key];
  normalized.subscription = snapshotExternalSubscriptionForRuntime(snapshot.subscription);
  return Object.freeze(normalized);
}

export function sendOptionsRuntimeMessage(api, message) {
  const runtime = captureOptionsRuntimeCollaboratorValue(api, "runtime", "Settings runtime namespace");
  const sendMessage = captureOptionsRuntimeCollaboratorValue(runtime, "sendMessage", "Settings runtime.sendMessage");
  if (typeof sendMessage !== "function") throw new TypeError("Settings runtime.sendMessage must be a data function");
  const safeMessage = normalizeOptionsRuntimeMessage(snapshotOptionsRuntimeMessage(message));
  return Reflect.apply(sendMessage, runtime, [safeMessage]);
}
