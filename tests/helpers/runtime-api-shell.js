function eventStub() {
  return {
    addListener() {},
    removeListener() {}
  };
}

function storageAreaStub() {
  return {
    async get() { return {}; },
    async set() {}
  };
}

function mergeNamespace(base, override) {
  if (override === undefined) return base;
  if (!override || typeof override !== "object" || Array.isArray(override)) return override;
  return { ...base, ...override };
}

/**
 * Test-only complete WebExtension API shell.
 *
 * Production code intentionally requires/captures browser collaborators early.
 * Focused tests can override only the namespace/method they exercise without
 * accidentally failing first because a newly hardened unrelated collaborator
 * is absent from an old hand-built fixture.
 */
export function createRuntimeApiShell(overrides = {}) {
  const runtime = {
    onInstalled: eventStub(),
    onStartup: eventStub(),
    onMessage: eventStub(),
    getURL(path) { return `extension://drop-ads/${path}`; }
  };
  const storage = {
    local: storageAreaStub(),
    session: storageAreaStub(),
    onChanged: eventStub()
  };
  const declarativeNetRequest = {
    MAX_NUMBER_OF_DYNAMIC_RULES: 5_000,
    async getDynamicRules() { return []; },
    async updateDynamicRules() {}
  };
  const contextMenus = {
    onClicked: eventStub(),
    async removeAll() {},
    create() { return undefined; }
  };
  const alarms = {
    onAlarm: eventStub(),
    async clear() { return false; },
    create() {},
    async get() { return null; }
  };
  const tabs = {
    async query() { return []; },
    async sendMessage() { return undefined; },
    async create() { return undefined; }
  };

  return {
    ...overrides,
    runtime: mergeNamespace(runtime, overrides.runtime),
    storage: mergeNamespace(storage, overrides.storage),
    declarativeNetRequest: mergeNamespace(declarativeNetRequest, overrides.declarativeNetRequest),
    contextMenus: mergeNamespace(contextMenus, overrides.contextMenus),
    alarms: mergeNamespace(alarms, overrides.alarms),
    tabs: mergeNamespace(tabs, overrides.tabs)
  };
}
