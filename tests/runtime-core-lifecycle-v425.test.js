import test from "node:test";
import assert from "node:assert/strict";

import { createBackgroundRuntime } from "../src/core/runtime.js";

function eventSource({ throwOnRemove = false } = {}) {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) {
      if (throwOnRemove) throw new Error("remove unavailable");
      listeners.delete(listener);
    },
    fire(...args) {
      const results = [];
      for (const listener of [...listeners]) results.push(listener(...args));
      return results;
    },
    size() { return listeners.size; }
  };
}

function makeApi(options = {}) {
  const onInstalled = eventSource(options.installed);
  const onStartup = eventSource();
  const onMessage = eventSource(options.message);
  const onClicked = eventSource();
  const onAlarm = eventSource();
  const onChanged = eventSource();
  const api = {
    runtime: {
      onInstalled,
      onStartup,
      onMessage,
      getURL(path) { return `moz-extension://drop-ads/${path}`; }
    },
    storage: {
      local: { get: async () => ({}), set: async () => undefined },
      session: { get: async () => ({}), set: async () => undefined },
      onChanged
    },
    declarativeNetRequest: {
      MAX_NUMBER_OF_DYNAMIC_RULES: 5000,
      getDynamicRules: async () => [],
      updateDynamicRules: async () => undefined
    },
    contextMenus: {
      onClicked,
      removeAll: async () => undefined,
      create() {}
    },
    alarms: {
      onAlarm,
      clear: async () => true,
      create() {}
    },
    tabs: { create: async () => undefined }
  };
  return { api, events: { onInstalled, onStartup, onMessage, onClicked, onAlarm, onChanged } };
}

const eventValues = (events) => Object.values(events);

test("M425 start is idempotent and dispose removes this runtime's stable listeners", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api });

  assert.equal(runtime.start(), runtime);
  assert.equal(runtime.start(), runtime);
  for (const event of eventValues(events)) assert.equal(event.size(), 1);

  runtime.dispose();
  runtime.dispose();
  for (const event of eventValues(events)) assert.equal(event.size(), 0);
  assert.throws(() => runtime.start(), /disposed/i);
});

test("M425 teardown uses captured event objects even after API event paths mutate", () => {
  const { api, events } = makeApi();
  const runtime = createBackgroundRuntime({ api }).start();
  const replacements = {
    onInstalled: eventSource(),
    onStartup: eventSource(),
    onMessage: eventSource(),
    onClicked: eventSource(),
    onAlarm: eventSource(),
    onChanged: eventSource()
  };

  api.runtime.onInstalled = replacements.onInstalled;
  api.runtime.onStartup = replacements.onStartup;
  api.runtime.onMessage = replacements.onMessage;
  api.contextMenus.onClicked = replacements.onClicked;
  api.alarms.onAlarm = replacements.onAlarm;
  api.storage.onChanged = replacements.onChanged;

  runtime.dispose();
  for (const event of eventValues(events)) assert.equal(event.size(), 0);
  for (const event of eventValues(replacements)) assert.equal(event.size(), 0);
});

test("M425 browser-retained callbacks become inert when removal itself fails", () => {
  const { api, events } = makeApi({ installed: { throwOnRemove: true }, message: { throwOnRemove: true } });
  const runtime = createBackgroundRuntime({ api }).start();
  runtime.dispose();

  assert.equal(events.onInstalled.size(), 1);
  assert.equal(events.onMessage.size(), 1);
  assert.doesNotThrow(() => events.onInstalled.fire({ reason: "update" }));
  assert.deepEqual(events.onMessage.fire({ type: "drop-ads:get-ui-state" }, {}, () => {}), [false]);
});
