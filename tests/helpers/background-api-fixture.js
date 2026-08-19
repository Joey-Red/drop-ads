function eventStub() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    hasListener(listener) { return listeners.has(listener); }
  };
}

function fill(object, key, value) {
  if (!Object.hasOwn(object, key)) object[key] = value;
  return object[key];
}

export function completeBackgroundApiFixture(api = {}) {
  if (!api || typeof api !== "object" || Array.isArray(api)) throw new TypeError("background API fixture must be an object");

  const runtime = fill(api, "runtime", {});
  fill(runtime, "onInstalled", eventStub());
  fill(runtime, "onStartup", eventStub());
  fill(runtime, "onMessage", eventStub());
  fill(runtime, "getURL", (path) => `moz-extension://fixture/${path}`);

  const storage = fill(api, "storage", {});
  const local = fill(storage, "local", {});
  fill(local, "get", async () => ({}));
  fill(local, "set", async () => undefined);
  const session = fill(storage, "session", {});
  fill(session, "get", async () => ({}));
  fill(session, "set", async () => undefined);
  fill(storage, "onChanged", eventStub());

  const dnr = fill(api, "declarativeNetRequest", {});
  fill(dnr, "getDynamicRules", async () => []);
  fill(dnr, "updateDynamicRules", async () => undefined);
  fill(dnr, "MAX_NUMBER_OF_DYNAMIC_RULES", 30_000);

  const contextMenus = fill(api, "contextMenus", {});
  fill(contextMenus, "onClicked", eventStub());
  fill(contextMenus, "removeAll", async () => undefined);
  fill(contextMenus, "create", () => undefined);

  const alarms = fill(api, "alarms", {});
  fill(alarms, "onAlarm", eventStub());
  fill(alarms, "clear", async () => true);
  fill(alarms, "create", async () => undefined);
  fill(alarms, "get", async () => null);

  const tabs = fill(api, "tabs", {});
  fill(tabs, "query", async () => []);
  fill(tabs, "create", async () => ({}));
  fill(tabs, "sendMessage", async () => undefined);

  return api;
}
