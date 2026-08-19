import test from "node:test";
import assert from "node:assert/strict";

import {
  LIST_REFRESH_WATCHDOG_ALARM,
  installRefreshWatchdog
} from "../src/core/refresh-watchdog.js";

function alarmEvent() {
  return {
    addListener() {},
    removeListener() {}
  };
}

test("M431 watchdog ready waits for asynchronous alarm creation", async () => {
  let resolveCreate;
  let readySettled = false;
  const createPromise = new Promise((resolve) => { resolveCreate = resolve; });
  const api = {
    alarms: {
      onAlarm: alarmEvent(),
      async get(name) {
        assert.equal(name, LIST_REFRESH_WATCHDOG_ALARM);
        return null;
      },
      create(name, options) {
        assert.equal(name, LIST_REFRESH_WATCHDOG_ALARM);
        assert.deepEqual(options, { periodInMinutes: 30 });
        return createPromise;
      }
    }
  };
  const controller = { refreshListsOnce() {} };
  const installation = installRefreshWatchdog({ api, controller });
  installation.ready.then(() => { readySettled = true; });

  await Promise.resolve();
  await Promise.resolve();
  assert.equal(readySettled, false);

  resolveCreate();
  assert.equal(await installation.ready, true);
  assert.equal(readySettled, true);
  installation.dispose();
});

test("M431 watchdog ready also supports synchronous alarm creation", async () => {
  let created = false;
  const api = {
    alarms: {
      onAlarm: alarmEvent(),
      async get() { return null; },
      create() { created = true; }
    }
  };
  const installation = installRefreshWatchdog({ api, controller: { refreshListsOnce() {} } });
  assert.equal(await installation.ready, true);
  assert.equal(created, true);
  installation.dispose();
});
