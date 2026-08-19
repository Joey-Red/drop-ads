import { resetConfiguredSettings } from "./settings-reset-operation.js";
import { SETTINGS_RESET_MESSAGE_TYPE, validateSettingsResetMessage } from "./settings-reset-message.js";

function ownResetType(message) {
  if (!message || typeof message !== "object") return false;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(message, "type");
    return Boolean(descriptor && "value" in descriptor && descriptor.value === SETTINGS_RESET_MESSAGE_TYPE);
  } catch {
    return false;
  }
}

export function createResetPartitionedApi(api) {
  const rawRuntime = api?.runtime;
  const rawOnMessage = rawRuntime?.onMessage;
  if (!rawRuntime || !rawOnMessage || typeof rawOnMessage.addListener !== "function") {
    throw new TypeError("Settings reset partition requires runtime.onMessage");
  }
  const wrappers = new Map();
  const onMessage = Object.freeze({
    addListener(listener) {
      if (typeof listener !== "function") throw new TypeError("Core message listener must be callable");
      if (wrappers.has(listener)) return;
      const wrapper = (message, sender, sendResponse) => ownResetType(message) ? false : listener(message, sender, sendResponse);
      wrappers.set(listener, wrapper);
      rawOnMessage.addListener(wrapper);
    },
    removeListener(listener) {
      const wrapper = wrappers.get(listener);
      if (!wrapper) return;
      wrappers.delete(listener);
      try { rawOnMessage.removeListener?.(wrapper); } catch { /* logical removal wins */ }
    },
    hasListener(listener) { return wrappers.has(listener); }
  });
  const runtime = new Proxy(rawRuntime, {
    get(target, property, receiver) {
      if (property === "onMessage") return onMessage;
      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? (...args) => Reflect.apply(value, target, args) : value;
    }
  });
  return new Proxy(api, {
    get(target, property, receiver) {
      if (property === "runtime") return runtime;
      return Reflect.get(target, property, receiver);
    }
  });
}

export function installSettingsResetRuntime({ api, core }) {
  const event = api?.runtime?.onMessage;
  if (!event || typeof event.addListener !== "function" || typeof event.removeListener !== "function") {
    throw new TypeError("Settings reset runtime requires runtime.onMessage lifecycle support");
  }
  let active = true;
  const listener = (message, _sender, sendResponse) => {
    if (!active || !ownResetType(message)) return false;
    try { validateSettingsResetMessage(message); }
    catch {
      try { sendResponse({ ok: false, error: "Invalid settings reset request" }); } catch { }
      return true;
    }
    void resetConfiguredSettings(core)
      .then((result) => { if (active) try { sendResponse({ ok: true, result }); } catch { } })
      .catch(() => { if (active) try { sendResponse({ ok: false, error: "Could not reset configured settings" }); } catch { } });
    return true;
  };
  event.addListener(listener);
  return Object.freeze({
    dispose() {
      if (!active) return;
      active = false;
      try { event.removeListener(listener); } catch { }
    }
  });
}
