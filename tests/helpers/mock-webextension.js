function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function createEvent() {
  const listeners = [];
  return {
    addListener(listener) {
      listeners.push(listener);
    },
    emit(...args) {
      return listeners.map((listener) => listener(...args));
    },
    get listeners() {
      return [...listeners];
    }
  };
}

export function createMockWebExtension({ dynamicRuleLimit = 5_000, initialStorage = {}, initialTabs = [] } = {}) {
  const storageData = clone(initialStorage) ?? {};
  const sessionData = {};
  const dynamicRules = new Map();
  const menus = new Map();
  const alarms = new Map();
  const tabs = clone(initialTabs) ?? [];
  const tabMessages = [];
  const dnrUpdates = [];
  const storageChanges = [];
  const actionBadges = new Map();
  const actionTitles = new Map();
  const dynamicUpdateFailures = [];
  let failNextLocalSet = false;
  let failNextSessionSet = false;
  let failNextTabCreate = false;

  const storageChanged = createEvent();
  const runtimeInstalled = createEvent();
  const runtimeStartup = createEvent();
  const runtimeMessage = createEvent();
  const menuClicked = createEvent();
  const alarmEvent = createEvent();

  function makeStorageArea(data, areaName) {
    return {
      async get(key) {
        if (typeof key === "string") return { [key]: clone(data[key]) };
        if (Array.isArray(key)) return Object.fromEntries(key.map((item) => [item, clone(data[item])]));
        return clone(data);
      },
      async set(items) {
        if (areaName === "local" && failNextLocalSet) {
          failNextLocalSet = false;
          throw new Error("simulated local storage failure");
        }
        if (areaName === "session" && failNextSessionSet) {
          failNextSessionSet = false;
          throw new Error("simulated session storage failure");
        }
        const changes = {};
        for (const [key, value] of Object.entries(items)) {
          const oldValue = clone(data[key]);
          data[key] = clone(value);
          changes[key] = { oldValue, newValue: clone(value) };
        }
        storageChanges.push({ areaName, changes: clone(changes) });
        storageChanged.emit(changes, areaName);
      }
    };
  }

  const api = {
    runtime: {
      onInstalled: runtimeInstalled,
      onStartup: runtimeStartup,
      onMessage: runtimeMessage,
      getURL(path) {
        return `extension://drop-ads/${path}`;
      }
    },
    storage: {
      local: makeStorageArea(storageData, "local"),
      session: makeStorageArea(sessionData, "session"),
      onChanged: storageChanged
    },
    declarativeNetRequest: {
      MAX_NUMBER_OF_DYNAMIC_RULES: dynamicRuleLimit,
      async getDynamicRules() {
        return [...dynamicRules.values()].map(clone);
      },
      async updateDynamicRules({ removeRuleIds = [], addRules = [] }) {
        const shouldFail = dynamicUpdateFailures.length ? dynamicUpdateFailures.shift() : false;
        if (shouldFail) throw new Error("simulated atomic DNR failure");
        const next = new Map(dynamicRules);
        for (const id of removeRuleIds) next.delete(id);
        for (const rule of addRules) next.set(rule.id, clone(rule));
        dynamicRules.clear();
        for (const [id, rule] of next) dynamicRules.set(id, rule);
        dnrUpdates.push({ removeRuleIds: clone(removeRuleIds), addRules: clone(addRules) });
      }
    },
    contextMenus: {
      onClicked: menuClicked,
      async removeAll() {
        menus.clear();
      },
      create(item) {
        menus.set(item.id, clone(item));
        return item.id;
      }
    },
    alarms: {
      onAlarm: alarmEvent,
      async clear(name) {
        return alarms.delete(name);
      },
      create(name, info) {
        alarms.set(name, clone(info));
      }
    },
    tabs: {
      async create(options) {
        if (failNextTabCreate) {
          failNextTabCreate = false;
          throw new Error("simulated tab creation failure");
        }
        tabs.push(clone(options));
        return { id: tabs.length, ...clone(options) };
      },
      async query() {
        return tabs.map((tab, index) => ({ id: Number.isInteger(tab?.id) ? tab.id : index + 1, ...clone(tab) }));
      },
      async sendMessage(tabId, message, options) {
        tabMessages.push({ tabId, message: clone(message), options: clone(options) });
        return undefined;
      }
    },
    action: {
      async setBadgeText({ tabId = 0, text = "" }) {
        actionBadges.set(tabId, text);
      },
      async setTitle({ tabId = 0, title = "" }) {
        actionTitles.set(tabId, title);
      }
    }
  };

  async function sendMessage(message, sender = {}) {
    const listeners = runtimeMessage.listeners;
    if (!listeners.length) throw new Error("No runtime message listener registered");
    return new Promise((resolve, reject) => {
      let responded = false;
      let keepChannelOpen = false;
      const sendResponse = (response) => {
        if (responded) return;
        responded = true;
        resolve(response);
      };
      for (const listener of listeners) {
        const result = listener(message, sender, sendResponse);
        if (result === true) keepChannelOpen = true;
        if (responded) break;
      }
      if (!keepChannelOpen && !responded) reject(new Error("Message channel was not kept open"));
    });
  }

  return {
    api,
    events: {
      runtimeInstalled,
      runtimeStartup,
      runtimeMessage,
      menuClicked,
      alarmEvent,
      storageChanged
    },
    inspect: {
      storageData,
      sessionData,
      dynamicRules,
      menus,
      alarms,
      tabs,
      tabMessages,
      dnrUpdates,
      storageChanges,
      actionBadges,
      actionTitles,
      failNextDynamicUpdate() {
        dynamicUpdateFailures.push(true);
      },
      queueDynamicUpdateFailures(pattern) {
        if (!Array.isArray(pattern) || pattern.some((value) => typeof value !== "boolean")) {
          throw new TypeError("DNR failure pattern must be an array of booleans");
        }
        dynamicUpdateFailures.push(...pattern);
      },
      failNextLocalSet() {
        failNextLocalSet = true;
      },
      failNextSessionSet() {
        failNextSessionSet = true;
      },
      failNextTabCreate() {
        failNextTabCreate = true;
      }
    },
    sendMessage
  };
}

export function createFixtureFetch() {
  let failRemote = false;
  const calls = [];

  function response(body, { status = 200, headers = {} } = {}) {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: {
        get(name) {
          const match = Object.entries(headers).find(([key]) => key.toLowerCase() === String(name).toLowerCase());
          return match ? match[1] : null;
        }
      },
      async text() {
        return String(body);
      },
      async json() {
        return JSON.parse(String(body));
      }
    };
  }

  async function fetchImpl(url, options) {
    calls.push({ url: String(url), options: clone(options) });
    const value = String(url);

    if (value === "extension://drop-ads/lists/default.meta.json") {
      return response(JSON.stringify({
        schemaVersion: 1,
        id: "drop-ads-default",
        title: "Drop Ads Default",
        format: "drop-ads-v1"
      }));
    }
    if (value === "extension://drop-ads/lists/default.txt") {
      return response("block domain bundled.example\n");
    }
    if (value.startsWith("https://")) {
      if (failRemote) return response("unavailable", { status: 503 });
      if (value.includes("hagezi/dns-blocklists")) {
        return response("||ads.bootstrap.example^\n@@||needed.bootstrap.example^\nexample.com##.sponsor\nexample.com#@#.needed\n");
      }
      if (value.includes("Joey-Red/drop-ads")) {
        return response("block domain community.remote.example\n");
      }
    }

    return response("not found", { status: 404 });
  }

  return {
    fetchImpl,
    calls,
    setRemoteFailure(value) {
      failRemote = value === true;
    }
  };
}
