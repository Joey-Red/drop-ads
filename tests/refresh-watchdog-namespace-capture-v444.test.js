import test from "node:test";
import assert from "node:assert/strict";

import {
  installRefreshWatchdog,
  LIST_REFRESH_WATCHDOG_ALARM
} from "../src/core/refresh-watchdog.js";

const controller = { refreshListsOnce() { return Promise.resolve("current"); } };

test("refresh watchdog rejects alarm namespace accessors without executing them", () => {
  let getterCalls = 0;
  const api = {};
  Object.defineProperty(api, "alarms", {
    get() {
      getterCalls += 1;
      return {};
    }
  });

  assert.throws(
    () => installRefreshWatchdog({ api, controller }),
    /alarms namespace must be a data property/
  );
  assert.equal(getterCalls, 0);
});

test("refresh watchdog rejects onAlarm accessors without executing them", () => {
  let getterCalls = 0;
  const alarms = {
    get() { return Promise.resolve(null); },
    create() {}
  };
  Object.defineProperty(alarms, "onAlarm", {
    get() {
      getterCalls += 1;
      return {};
    }
  });

  assert.throws(
    () => installRefreshWatchdog({ api: { alarms }, controller }),
    /alarms\.onAlarm event must be a data property/
  );
  assert.equal(getterCalls, 0);
});

test("prototype data namespaces and event methods remain supported", async () => {
  const listeners = new Set();
  let createCalls = 0;

  class AlarmEvent {
    addListener(listener) { listeners.add(listener); }
    removeListener(listener) { listeners.delete(listener); }
  }
  class Alarms {
    constructor() { this.onAlarm = new AlarmEvent(); }
    get(name) {
      assert.equal(name, LIST_REFRESH_WATCHDOG_ALARM);
      return Promise.resolve(null);
    }
    create(name, options) {
      assert.equal(name, LIST_REFRESH_WATCHDOG_ALARM);
      assert.equal(options.periodInMinutes, 30);
      createCalls += 1;
    }
  }
  class Api {}
  Object.defineProperty(Api.prototype, "alarms", {
    value: new Alarms(),
    configurable: true
  });

  const api = new Api();
  const installation = installRefreshWatchdog({ api, controller });
  assert.equal(await installation.ready, true);
  assert.equal(createCalls, 1);
  assert.equal(listeners.size, 1);
  installation.dispose();
  assert.equal(listeners.size, 0);
});
