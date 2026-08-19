import test from "node:test";
import assert from "node:assert/strict";

import { installRefreshWatchdog, LIST_REFRESH_WATCHDOG_ALARM } from "../src/core/refresh-watchdog.js";

class EventSurface {
  constructor() { this.listeners = []; }
  addListener(listener) { this.listeners.push(listener); }
  removeListener(listener) { this.listeners = this.listeners.filter((item) => item !== listener); }
}

function makeApi() {
  return {
    alarms: {
      onAlarm: new EventSurface(),
      async get() { return { name: LIST_REFRESH_WATCHDOG_ALARM }; },
      create() {}
    }
  };
}

test("refresh watchdog returns existing registration before controller/logger/alarm recapture", async () => {
  const api = makeApi();
  const first = installRefreshWatchdog({
    api,
    controller: { async refreshListsOnce() {} },
    logger: { warn() {} }
  });
  await first.ready;

  let controllerGetterCalls = 0;
  const hostileController = {};
  Object.defineProperty(hostileController, "refreshListsOnce", {
    enumerable: true,
    get() {
      controllerGetterCalls += 1;
      throw new Error("controller getter must not run on reinstall");
    }
  });
  let loggerGetterCalls = 0;
  const hostileLogger = {};
  Object.defineProperty(hostileLogger, "warn", {
    enumerable: true,
    get() {
      loggerGetterCalls += 1;
      throw new Error("logger getter must not run on reinstall");
    }
  });
  let alarmGetterCalls = 0;
  Object.defineProperty(api, "alarms", {
    configurable: true,
    get() {
      alarmGetterCalls += 1;
      throw new Error("alarm namespace getter must not run on reinstall");
    }
  });

  const second = installRefreshWatchdog({ api, controller: hostileController, logger: hostileLogger });
  assert.equal(second, first);
  assert.equal(controllerGetterCalls, 0);
  assert.equal(loggerGetterCalls, 0);
  assert.equal(alarmGetterCalls, 0);

  first.dispose();
});
