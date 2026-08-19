import test from "node:test";
import assert from "node:assert/strict";
import {
  installRefreshWatchdog,
  LIST_REFRESH_WATCHDOG_ALARM,
  LIST_REFRESH_WATCHDOG_MINUTES
} from "../src/core/refresh-watchdog.js";

function alarmEvent() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

test("M421 watchdog ready path uses receiver-bound alarm collaborators captured at install", async () => {
  const onAlarm = alarmEvent();
  const calls = [];
  const alarms = {
    onAlarm,
    async get(name) {
      assert.equal(this, alarms);
      calls.push(["get", name]);
      return undefined;
    },
    create(name, options) {
      assert.equal(this, alarms);
      calls.push(["create", name, options]);
    }
  };
  const api = { alarms };
  const controller = { async refreshListsOnce() {} };
  const installation = installRefreshWatchdog({ api, controller });

  alarms.get = () => { throw new Error("late get mutation"); };
  alarms.create = () => { throw new Error("late create mutation"); };

  assert.equal(await installation.ready, true);
  assert.deepEqual(calls, [
    ["get", LIST_REFRESH_WATCHDOG_ALARM],
    ["create", LIST_REFRESH_WATCHDOG_ALARM, { periodInMinutes: LIST_REFRESH_WATCHDOG_MINUTES }]
  ]);
  installation.dispose();
});
