import { normalizeDomain, normalizeHttpUrl, ruleKey } from "./rules.js";
import { loadState, STORAGE_KEY } from "./storage.js";
import { MENU_BLOCK_DEFAULT, MENU_BLOCK_DOMAIN, MENU_BLOCK_EXACT } from "./runtime.js";
import { assertPlainExactObject, readPlainDataField, snapshotDenseDataArray } from "./object-schema.js";
import { LIVE_STATE_LIMITS } from "./state-limits.js";

const SUPPORTED_MENUS = new Set([MENU_BLOCK_DEFAULT, MENU_BLOCK_DOMAIN, MENU_BLOCK_EXACT]);
const CONTEXT_FEEDBACK_OPTION_KEYS = new Set(["api", "pendingMs", "visibleMs", "setTimeoutImpl", "clearTimeoutImpl"]);
const installations = new WeakMap();
const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;
export const MAX_PENDING_CONTEXT_FEEDBACK = 128;
export const MAX_VISIBLE_CONTEXT_FEEDBACK = 128;
export const MAX_CONTEXT_FEEDBACK_DELAY_MS = 60_000;

function ownDataValue(value, key) {
  const field = readPlainDataField(value, key);
  return field.safe && field.present ? field.value : undefined;
}

function optionField(options, key) {
  const field = readPlainDataField(options, key);
  if (!field.safe) throw new TypeError(`Context feedback option ${key} must remain an own enumerable data field`);
  return field;
}

function snapshotContextClick(info) {
  const menuField = readPlainDataField(info, "menuItemId");
  const srcField = readPlainDataField(info, "srcUrl");
  const linkField = readPlainDataField(info, "linkUrl");
  const frameUrlField = readPlainDataField(info, "frameUrl");
  const frameIdField = readPlainDataField(info, "frameId");
  if (!menuField.safe || !menuField.present || typeof menuField.value !== "string" || !SUPPORTED_MENUS.has(menuField.value)) return null;
  if (!srcField.safe || !linkField.safe || !frameUrlField.safe || !frameIdField.safe) return null;
  const targetUrl = srcField.present ? srcField.value : linkField.present ? linkField.value : frameUrlField.present ? frameUrlField.value : null;
  if (typeof targetUrl !== "string" || !targetUrl) return null;
  if (frameIdField.present && (!Number.isInteger(frameIdField.value) || frameIdField.value < 0)) return null;
  return Object.freeze({
    menuItemId: menuField.value,
    targetUrl,
    frameId: frameIdField.present ? frameIdField.value : 0
  });
}

function candidateFromClick(snapshot) {
  try {
    return snapshot.menuItemId === MENU_BLOCK_EXACT
      ? { kind: "url", value: normalizeHttpUrl(snapshot.targetUrl) }
      : { kind: "domain", value: normalizeDomain(snapshot.targetUrl) };
  } catch {
    return null;
  }
}

function validateDelay(value, label) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_CONTEXT_FEEDBACK_DELAY_MS) {
    throw new RangeError(`${label} must be an integer between 1 and ${MAX_CONTEXT_FEEDBACK_DELAY_MS} milliseconds`);
  }
  return value;
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

function captureReceiverValue(receiver, key, label, required = true) {
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
      if (!("value" in descriptor)) throw new TypeError(`${label} must be a data property`);
      return descriptor.value;
    }
    try { current = Object.getPrototypeOf(current); }
    catch { throw new TypeError(`${label} prototype is not safely inspectable`); }
  }
  if (!required) return null;
  throw new TypeError(`${label} is unavailable`);
}

function captureEvent(event, label) {
  if (!event) return null;
  return Object.freeze({
    addListener: captureReceiverMethod(event, "addListener", `${label}.addListener`),
    removeListener: captureReceiverMethod(event, "removeListener", `${label}.removeListener`, false)
  });
}

function captureContextFeedbackCollaborators(api) {
  const contextMenus = captureReceiverValue(api, "contextMenus", "Context feedback contextMenus namespace", false);
  const storage = captureReceiverValue(api, "storage", "Context feedback storage namespace", false);
  const action = captureReceiverValue(api, "action", "Context feedback action namespace", false);
  const tabs = captureReceiverValue(api, "tabs", "Context feedback tabs namespace", false);
  const dnr = captureReceiverValue(api, "declarativeNetRequest", "Context feedback declarativeNetRequest namespace", false);
  const contextClicked = captureReceiverValue(contextMenus, "onClicked", "Context feedback context-menu event", false);
  const storageChanged = captureReceiverValue(storage, "onChanged", "Context feedback storage event", false);
  const storageLocal = captureReceiverValue(storage, "local", "Context feedback storage.local namespace", false);
  if (!contextClicked || !storageChanged || !action) return null;

  const contextClickedEvent = captureEvent(contextClicked, "Context feedback context-menu event");
  const storageChangedEvent = captureEvent(storageChanged, "Context feedback storage event");
  const setTitle = captureReceiverMethod(action, "setTitle", "Context feedback action.setTitle", false);
  if (!setTitle) return null;
  const setBadgeText = captureReceiverMethod(action, "setBadgeText", "Context feedback action.setBadgeText", false);
  const sendMessage = captureReceiverMethod(tabs, "sendMessage", "Context feedback tabs.sendMessage", false);
  const localGet = captureReceiverMethod(storageLocal, "get", "Context feedback storage.local.get", false);
  const countOptionSetter = captureReceiverMethod(
    dnr,
    "setExtensionActionOptions",
    "Context feedback declarativeNetRequest.setExtensionActionOptions",
    false
  );
  const stateReadApi = localGet
    ? Object.freeze({ storage: Object.freeze({ local: Object.freeze({ get: localGet }) }) })
    : null;
  return Object.freeze({
    contextClickedEvent,
    storageChangedEvent,
    setTitle,
    setBadgeText,
    sendMessage,
    stateReadApi,
    preserveBrowserCount: countOptionSetter !== null
  });
}

function removeListenerBestEffort(removeListener, listener) {
  if (!removeListener) return;
  try { removeListener(listener); } catch { /* listener teardown must not retain context state */ }
}

function installListenersTransactionally(entries) {
  const installed = [];
  try {
    for (const [event, listener] of entries) {
      event.addListener(listener);
      installed.push([event, listener]);
    }
  } catch (error) {
    for (let index = installed.length - 1; index >= 0; index -= 1) {
      removeListenerBestEffort(installed[index][0].removeListener, installed[index][1]);
    }
    throw error;
  }
}

export function installContextBlockFeedback(options = {}) {
  assertPlainExactObject(options, "Context feedback options", CONTEXT_FEEDBACK_OPTION_KEYS);
  const apiField = optionField(options, "api");
  const pendingField = optionField(options, "pendingMs");
  const visibleField = optionField(options, "visibleMs");
  const setTimeoutField = optionField(options, "setTimeoutImpl");
  const clearTimeoutField = optionField(options, "clearTimeoutImpl");
  const api = apiField.present ? apiField.value : undefined;
  const pendingMs = pendingField.present ? pendingField.value : 5_000;
  const visibleMs = visibleField.present ? visibleField.value : 4_000;
  const setTimeoutImpl = setTimeoutField.present ? setTimeoutField.value : setTimeout;
  const clearTimeoutImpl = clearTimeoutField.present ? clearTimeoutField.value : clearTimeout;

  validateDelay(pendingMs, "Context feedback pending timeout");
  validateDelay(visibleMs, "Context feedback visible timeout");
  if (typeof setTimeoutImpl !== "function" || typeof clearTimeoutImpl !== "function") {
    throw new TypeError("Context feedback timer implementations must be functions");
  }
  const collaborators = captureContextFeedbackCollaborators(api);
  if (!collaborators) return { dispose() {} };

  const existingInstallation = installations.get(api);
  if (existingInstallation) return existingInstallation;

  const canUseFallbackBadge = !collaborators.preserveBrowserCount && collaborators.setBadgeText !== null;
  const pending = new Set();
  const visibleTimers = new Map();
  let nextVisibleGeneration = 1;
  let disposed = false;

  function clearTimerBestEffort(timer) {
    try { clearTimeoutImpl(timer); } catch { /* retention release must not depend on timer teardown */ }
  }

  function forget(entry) {
    pending.delete(entry);
    clearTimerBestEffort(entry.timer);
  }

  function reservePendingSlot() {
    if (pending.size < MAX_PENDING_CONTEXT_FEEDBACK) return;
    const oldest = pending.values().next().value;
    if (oldest) forget(oldest);
  }

  function resetTabStatus(tabId) {
    if (canUseFallbackBadge) {
      try { void Promise.resolve(collaborators.setBadgeText({ tabId, text: "" })).catch(() => undefined); }
      catch { /* visible-status reset is best effort */ }
    }
    try { void Promise.resolve(collaborators.setTitle({ tabId, title: "drop-ads" })).catch(() => undefined); }
    catch { /* visible-status reset is best effort */ }
  }

  function discardVisibleStatus(tabId, status, { reset = true } = {}) {
    if (status?.timer != null) clearTimerBestEffort(status.timer);
    if (visibleTimers.get(tabId) === status) visibleTimers.delete(tabId);
    if (reset) resetTabStatus(tabId);
  }

  function reserveVisibleSlot(tabId) {
    if (visibleTimers.has(tabId) || visibleTimers.size < MAX_VISIBLE_CONTEXT_FEEDBACK) return;
    const oldest = visibleTimers.entries().next().value;
    if (!oldest) return;
    discardVisibleStatus(oldest[0], oldest[1]);
  }

  async function showTabStatus(tabId, title, fallbackBadge = "") {
    if (disposed) return;
    reserveVisibleSlot(tabId);
    const previous = visibleTimers.get(tabId);
    if (previous?.timer != null) clearTimerBestEffort(previous.timer);
    const status = { generation: nextVisibleGeneration++, timer: null };
    if (previous) visibleTimers.delete(tabId);
    visibleTimers.set(tabId, status);

    try {
      const updates = [Promise.resolve(collaborators.setTitle({ tabId, title }))];
      if (canUseFallbackBadge && fallbackBadge) updates.push(Promise.resolve(collaborators.setBadgeText({ tabId, text: fallbackBadge })));
      await Promise.all(updates);
    } catch (error) {
      if (visibleTimers.get(tabId) === status) {
        visibleTimers.delete(tabId);
        resetTabStatus(tabId);
      }
      throw error;
    }
    if (disposed || visibleTimers.get(tabId) !== status) return;

    let timer;
    try {
      timer = setTimeoutImpl(() => {
        if (visibleTimers.get(tabId) !== status) return;
        visibleTimers.delete(tabId);
        resetTabStatus(tabId);
      }, visibleMs);
    } catch (error) {
      if (visibleTimers.get(tabId) === status) {
        visibleTimers.delete(tabId);
        resetTabStatus(tabId);
      }
      throw error;
    }
    if (visibleTimers.get(tabId) === status) status.timer = timer;
    else clearTimerBestEffort(timer);
  }

  async function cleanupCommittedTarget(entry) {
    if (disposed || !collaborators.sendMessage) return false;
    try {
      const sendOptions = Number.isInteger(entry.frameId) ? { frameId: entry.frameId } : undefined;
      const result = sendOptions
        ? await collaborators.sendMessage(entry.tabId, { type: "drop-ads:cleanup-context-target", targetUrl: entry.targetUrl }, sendOptions)
        : await collaborators.sendMessage(entry.tabId, { type: "drop-ads:cleanup-context-target", targetUrl: entry.targetUrl });
      return !disposed && ownDataValue(result, "cleaned") === true;
    } catch {
      return false;
    }
  }

  async function settleCommittedBlock(entry) {
    if (disposed) return;
    const cleaned = await cleanupCommittedTarget(entry);
    if (disposed) return;
    if (cleaned) {
      await showTabStatus(entry.tabId, "Drop Ads — blocked locally and removed from this page.");
      return;
    }
    await showTabStatus(entry.tabId, "Drop Ads — blocked locally. Refresh the page to remove content that could not be safely cleaned up in place.", "↻");
  }

  function armPendingEntry(entry) {
    pending.add(entry);
    let timer;
    try {
      timer = setTimeoutImpl(() => pending.delete(entry), pendingMs);
    } catch {
      pending.delete(entry);
      return false;
    }
    if (pending.has(entry)) entry.timer = timer;
    else clearTimerBestEffort(timer);
    return pending.has(entry);
  }

  function onContextClick(info, tab) {
    const tabId = ownDataValue(tab, "id");
    if (disposed || !Number.isInteger(tabId) || tabId < 0) return;
    const click = snapshotContextClick(info);
    if (!click) return;
    const candidate = candidateFromClick(click);
    if (!candidate) return;

    reservePendingSlot();
    const entry = {
      key: ruleKey(candidate),
      tabId,
      frameId: click.frameId,
      targetUrl: click.targetUrl,
      timer: null
    };
    if (!armPendingEntry(entry)) return;

    // A repeated block may already be committed and therefore emit no storage change.
    // Reading committed state lets the explicit cleanup still occur without treating an
    // uncommitted new rule as successful. The storage reader is captured at install time
    // so later API mutation cannot redirect this recovery read.
    if (collaborators.stateReadApi) {
      void loadState(collaborators.stateReadApi).then((state) => {
        if (disposed || !pending.has(entry)) return;
        const exists = (state.personalBlock ?? []).some((rule) => {
          try { return ruleKey(rule) === entry.key; } catch { return false; }
        });
        if (!exists) return;
        forget(entry);
        void settleCommittedBlock(entry).catch(() => undefined);
      }).catch(() => undefined);
    }
  }

  function onStorageChanged(changes, areaName) {
    if (disposed || areaName !== "local") return;
    const stateChange = ownDataValue(changes, STORAGE_KEY);
    const newValue = ownDataValue(stateChange, "newValue");
    const rawPersonalBlock = ownDataValue(newValue, "personalBlock");
    let personalBlock;
    try {
      personalBlock = snapshotDenseDataArray(rawPersonalBlock, "Context feedback personalBlock", LIVE_STATE_LIMITS.personalRules);
    } catch {
      return;
    }
    const keys = new Set(personalBlock.map((rule) => {
      try { return ruleKey(rule); } catch { return null; }
    }).filter(Boolean));
    for (const entry of [...pending]) {
      if (!keys.has(entry.key)) continue;
      forget(entry);
      void settleCommittedBlock(entry).catch(() => undefined);
    }
  }

  installListenersTransactionally([
    [collaborators.contextClickedEvent, onContextClick],
    [collaborators.storageChangedEvent, onStorageChanged]
  ]);

  const registration = {
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        removeListenerBestEffort(collaborators.contextClickedEvent.removeListener, onContextClick);
        removeListenerBestEffort(collaborators.storageChangedEvent.removeListener, onStorageChanged);
        for (const entry of [...pending]) forget(entry);
        for (const [tabId, status] of [...visibleTimers]) discardVisibleStatus(tabId, status);
      } finally {
        pending.clear();
        visibleTimers.clear();
        if (installations.get(api) === registration) installations.delete(api);
      }
    }
  };
  installations.set(api, registration);
  return registration;
}
