import { assertPlainExactObject, readPlainDataField } from "./object-schema.js";

export const LIST_REFRESH_WATCHDOG_ALARM = "drop-ads:list-refresh-watchdog";
export const LIST_REFRESH_WATCHDOG_MINUTES = 30;

const WATCHDOG_OPTION_KEYS = new Set(["api", "controller", "logger"]);
const installations = new WeakMap();
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;

function optionValue(options, key) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new TypeError(`Refresh watchdog option ${key} must remain an own enumerable data field`);
  return field.present ? field.value : undefined;
}

function capturedReceiverCall(callback, receiver) {
  return (...args) => Reflect.apply(callback, receiver, args);
}

function suppliedWarning(options) {
  const loggerField = readPlainDataField(options, "logger");
  if (!loggerField.safe) throw new TypeError("Refresh watchdog logger option is invalid");
  if (!loggerField.present) return capturedReceiverCall(console.warn, console);
  const warnField = readPlainDataField(loggerField.value, "warn");
  if (!warnField.safe || !warnField.present || typeof warnField.value !== "function") {
    throw new TypeError("Refresh watchdog logger must provide warn()");
  }
  return capturedReceiverCall(warnField.value, loggerField.value);
}

function warnBestEffort(warn, ...args) {
  try { warn(...args); } catch { /* optional watchdog logging must not escape */ }
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
      return capturedReceiverCall(descriptor.value, receiver);
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

function existingWatchdogAlarm(result) {
  if (result == null) return false;
  const nameField = readPlainDataField(result, "name");
  if (!nameField.safe || !nameField.present || typeof nameField.value !== "string") {
    throw new TypeError("Refresh watchdog alarm lookup result is invalid");
  }
  if (nameField.value !== LIST_REFRESH_WATCHDOG_ALARM) {
    throw new Error("Refresh watchdog alarm lookup returned the wrong alarm");
  }
  return true;
}

function removeListenerBestEffort(removeListener, listener) {
  if (!removeListener) return;
  try { removeListener(listener); } catch { /* teardown failure must not pin installation identity */ }
}

export function installRefreshWatchdog(options = {}) {
  assertPlainExactObject(options, "Refresh watchdog options", WATCHDOG_OPTION_KEYS);
  const api = optionValue(options, "api");
  const existingInstallation = installations.get(api);
  if (existingInstallation) return existingInstallation;

  const controller = optionValue(options, "controller");
  const warn = suppliedWarning(options);
  const refreshField = readPlainDataField(controller, "refreshListsOnce");
  if (!refreshField.safe || !refreshField.present || typeof refreshField.value !== "function") {
    throw new Error("Refresh watchdog requires the background runtime controller");
  }
  const refreshListsOnce = capturedReceiverCall(refreshField.value, controller);
  const alarms = captureDataValue(api, "alarms", "Refresh watchdog alarms namespace");
  const alarmEvent = captureDataValue(alarms, "onAlarm", "Refresh watchdog alarms.onAlarm event");
  const getAlarm = captureBoundMethod(alarms, "get", "Refresh watchdog alarms.get");
  const createAlarm = captureBoundMethod(alarms, "create", "Refresh watchdog alarms.create");
  const addAlarmListener = captureBoundMethod(alarmEvent, "addListener", "Refresh watchdog alarm addListener");
  const removeAlarmListener = captureBoundMethod(alarmEvent, "removeListener", "Refresh watchdog alarm removeListener", false);

  let active = true;
  const onAlarm = (alarm) => {
    if (!active) return;
    const nameField = readPlainDataField(alarm, "name");
    if (!nameField.safe || !nameField.present || typeof nameField.value !== "string" || nameField.value !== LIST_REFRESH_WATCHDOG_ALARM) return;
    void Promise.resolve()
      .then(() => refreshListsOnce(false))
      .catch((error) => {
        if (active) warnBestEffort(warn, "drop-ads due-source refresh watchdog failed; keeping last-known-good policy", error);
      });
  };

  try {
    addAlarmListener(onAlarm);
  } catch (error) {
    active = false;
    removeListenerBestEffort(removeAlarmListener, onAlarm);
    throw error;
  }

  const ready = Promise.resolve()
    .then(() => getAlarm(LIST_REFRESH_WATCHDOG_ALARM))
    .then(async (existing) => {
      if (!active || existingWatchdogAlarm(existing)) return false;
      await Promise.resolve(createAlarm(LIST_REFRESH_WATCHDOG_ALARM, { periodInMinutes: LIST_REFRESH_WATCHDOG_MINUTES }));
      return active;
    })
    .catch((error) => {
      if (active) warnBestEffort(warn, "drop-ads could not establish the due-source refresh watchdog", error);
      return false;
    });

  const installation = Object.freeze({
    ready,
    dispose() {
      if (!active) return;
      active = false;
      try {
        removeListenerBestEffort(removeAlarmListener, onAlarm);
      } finally {
        if (installations.get(api) === installation) installations.delete(api);
      }
    }
  });
  installations.set(api, installation);
  return installation;
}
