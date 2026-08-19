import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";

const POLICY_MESSAGE_TYPES = new Set([
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
  "drop-ads:import-settings"
]);

const POLICY_CONTEXT_MENU_IDS = new Set([
  "drop-ads:block-default",
  "drop-ads:block-exact",
  "drop-ads:block-domain"
]);

const LIST_REFRESH_ALARM = "drop-ads:list-refresh";
const CONVERGENCE_OPTION_KEYS = new Set(["api", "controller", "logger"]);
const REGISTRATIONS = new WeakMap();
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;
export const MAX_POLICY_CONVERGENCE_REASON_CHARS = 128;
export const MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS = 64;

function optionValue(options, key) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new TypeError(`Policy convergence option ${key} must remain an own enumerable data field`);
  return field.present ? field.value : undefined;
}

function receiverCall(callback, receiver) {
  return (...args) => Reflect.apply(callback, receiver, args);
}

function suppliedError(options) {
  const loggerField = readPlainDataField(options, "logger");
  if (!loggerField.safe) throw new TypeError("Policy convergence logger option is invalid");
  if (!loggerField.present) return receiverCall(console.error, console);
  const errorField = readPlainDataField(loggerField.value, "error");
  if (!errorField.safe || !errorField.present || typeof errorField.value !== "function") {
    throw new TypeError("Policy convergence logger must provide error()");
  }
  return receiverCall(errorField.value, loggerField.value);
}

function logErrorBestEffort(errorLog, ...args) {
  try { errorLog(...args); } catch { /* convergence recovery must not depend on logging */ }
}

function captureDataValue(receiver, key, label) {
  if (!receiver || (typeof receiver !== "object" && typeof receiver !== "function")) {
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
        if (!required && "value" in descriptor && descriptor.value == null) return null;
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

function captureEvent(event, label) {
  return Object.freeze({
    addListener: captureBoundMethod(event, "addListener", `${label}.addListener`),
    removeListener: captureBoundMethod(event, "removeListener", `${label}.removeListener`, false)
  });
}

function removeListenerBestEffort(removeListener, listener) {
  if (!removeListener) return;
  try { removeListener(listener); } catch { /* teardown continues across independent event sources */ }
}

function requireApi(api) {
  const runtime = captureDataValue(api, "runtime", "Policy convergence runtime namespace");
  const runtimeMessage = captureDataValue(runtime, "onMessage", "Policy convergence runtime.onMessage event");
  const contextMenus = captureDataValue(api, "contextMenus", "Policy convergence contextMenus namespace");
  const contextClicked = captureDataValue(contextMenus, "onClicked", "Policy convergence contextMenus.onClicked event");
  const alarms = captureDataValue(api, "alarms", "Policy convergence alarms namespace");
  const alarm = captureDataValue(alarms, "onAlarm", "Policy convergence alarms.onAlarm event");
  if (!runtimeMessage || !contextClicked || !alarm) {
    throw new Error("Policy convergence requires runtime, contextMenus, and alarms events");
  }
  return Object.freeze({
    runtimeMessage: captureEvent(runtimeMessage, "Policy convergence runtime.onMessage"),
    contextClicked: captureEvent(contextClicked, "Policy convergence contextMenus.onClicked"),
    alarm: captureEvent(alarm, "Policy convergence alarms.onAlarm")
  });
}

function installListenersTransactionally(entries) {
  const installed = [];
  try {
    for (const [event, listener] of entries) {
      try {
        event.addListener(listener);
      } catch (error) {
        removeListenerBestEffort(event.removeListener, listener);
        throw error;
      }
      installed.push([event, listener]);
    }
  } catch (error) {
    for (let index = installed.length - 1; index >= 0; index -= 1) {
      removeListenerBestEffort(installed[index][0].removeListener, installed[index][1]);
    }
    throw error;
  }
}

function ownEnumerableDataString(value, key) {
  const field = readPlainDataField(value, key);
  if (!field.safe || !field.present || typeof field.value !== "string") return null;
  if (!field.value || field.value.length > MAX_POLICY_CONVERGENCE_DISCRIMINATOR_CHARS) return null;
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(field.value)) return null;
  return field.value;
}

function validateConvergenceReason(reason) {
  if (typeof reason !== "string") throw new TypeError("Policy convergence reason must be a string");
  if (!reason || reason.trim() !== reason) throw new TypeError("Policy convergence reason must be non-empty and already trimmed");
  if (reason.length > MAX_POLICY_CONVERGENCE_REASON_CHARS) {
    throw new RangeError(`Policy convergence reason exceeds ${MAX_POLICY_CONVERGENCE_REASON_CHARS} characters`);
  }
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(reason)) {
    throw new TypeError("Policy convergence reason must be single-line printable text");
  }
  return reason;
}

export function installPolicyConvergence(options = {}) {
  assertPlainExactObject(options, "Policy convergence options", CONVERGENCE_OPTION_KEYS);
  const api = optionValue(options, "api");
  const existing = REGISTRATIONS.get(api);
  if (existing) return existing;

  const controller = optionValue(options, "controller");
  const errorLog = suppliedError(options);
  const syncField = readPlainDataField(controller, "syncRules");
  if (!syncField.safe || !syncField.present || typeof syncField.value !== "function") {
    throw new Error("Policy convergence requires a background runtime controller");
  }
  const syncRules = receiverCall(syncField.value, controller);
  const events = requireApi(api);

  let active = true;
  let activeConvergence = null;
  let rerunReason = null;

  function queueConvergence(reason) {
    const safeReason = validateConvergenceReason(reason);
    if (!active) return Promise.resolve(false);
    if (activeConvergence) {
      rerunReason = safeReason;
      return activeConvergence;
    }

    activeConvergence = (async () => {
      let currentReason = safeReason;
      while (active && currentReason) {
        try {
          await syncRules();
        } catch (error) {
          logErrorBestEffort(errorLog, `drop-ads policy convergence failed after ${currentReason}`, error);
        }
        currentReason = active ? rerunReason : null;
        rerunReason = null;
      }
      return true;
    })().finally(() => {
      activeConvergence = null;
    });

    return activeConvergence;
  }

  const onMessage = (message) => {
    if (!active) return;
    const type = ownEnumerableDataString(message, "type");
    if (type && POLICY_MESSAGE_TYPES.has(type)) void queueConvergence(`runtime mutation ${type}`);
  };

  const onContextClicked = (info) => {
    if (!active) return;
    const menuItemId = ownEnumerableDataString(info, "menuItemId");
    if (menuItemId && POLICY_CONTEXT_MENU_IDS.has(menuItemId)) void queueConvergence(`context action ${menuItemId}`);
  };

  const onAlarm = (alarmInfo) => {
    if (!active) return;
    const name = ownEnumerableDataString(alarmInfo, "name");
    if (name === LIST_REFRESH_ALARM) void queueConvergence("scheduled list refresh");
  };

  installListenersTransactionally([
    [events.runtimeMessage, onMessage],
    [events.contextClicked, onContextClicked],
    [events.alarm, onAlarm]
  ]);

  function whenIdle() {
    return activeConvergence ?? Promise.resolve();
  }

  const registration = Object.freeze({
    queueConvergence,
    whenIdle,
    dispose() {
      if (!active) return;
      active = false;
      rerunReason = null;
      try {
        removeListenerBestEffort(events.runtimeMessage.removeListener, onMessage);
        removeListenerBestEffort(events.contextClicked.removeListener, onContextClicked);
        removeListenerBestEffort(events.alarm.removeListener, onAlarm);
      } finally {
        if (REGISTRATIONS.get(api) === registration) REGISTRATIONS.delete(api);
      }
    }
  });
  REGISTRATIONS.set(api, registration);
  return registration;
}
