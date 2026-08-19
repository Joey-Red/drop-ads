import test from "node:test";
import assert from "node:assert/strict";
import { createBackgroundRuntime } from "../src/core/runtime.js";

function eventSource() {
  const listeners = [];
  return {
    addListener(listener) { listeners.push(listener); },
    removeListener(listener) {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    emit(...args) { return listeners.map((listener) => listener(...args)); }
  };
}

function apiThatFailsInitialization() {
  return {
    runtime: {
      onInstalled: eventSource(),
      onStartup: eventSource(),
      onMessage: eventSource()
    },
    storage: { onChanged: eventSource() },
    declarativeNetRequest: {},
    contextMenus: {
      onClicked: eventSource(),
      async removeAll() { throw new Error("synthetic initialization failure"); },
      create() {}
    },
    alarms: {
      onAlarm: eventSource(),
      async clear() {},
      create() {}
    },
    tabs: {}
  };
}

test("M415 rejects accessor-backed logger fields without executing getters", () => {
  let gets = 0;
  const logger = {};
  Object.defineProperty(logger, "warn", {
    enumerable: true,
    get() { gets += 1; return () => undefined; }
  });
  Object.defineProperty(logger, "error", {
    enumerable: true,
    value() {}
  });
  assert.throws(
    () => createBackgroundRuntime({ api: apiThatFailsInitialization(), logger }),
    /own enumerable data warn\(\) and error\(\) functions/
  );
  assert.equal(gets, 0);
});

test("M415 captures logger callbacks once and preserves their receiver", async () => {
  const api = apiThatFailsInitialization();
  const calls = [];
  const logger = {
    marker: "original",
    warn() { calls.push(["warn", this.marker]); },
    error() { calls.push(["error", this.marker]); }
  };
  const runtime = createBackgroundRuntime({ api, logger });
  runtime.start();

  logger.error = function mutated() { calls.push(["mutated", this.marker]); };
  api.runtime.onInstalled.emit();
  await runtime.whenIdle();
  await Promise.resolve();

  assert.deepEqual(calls, [["error", "original"]]);
});

test("M415 default console logger remains optional", () => {
  assert.doesNotThrow(() => createBackgroundRuntime({ api: apiThatFailsInitialization() }));
});
