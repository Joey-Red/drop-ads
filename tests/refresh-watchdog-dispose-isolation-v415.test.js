import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function makeApi({ removeThrows = false } = {}) {
  const listeners = new Set();
  return {
    alarms: {
      onAlarm: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) {
          listeners.delete(listener);
          if (removeThrows) throw new Error("synthetic remove failure");
        }
      },
      async get() { return { name: "existing" }; },
      create() {}
    }
  };
}

test("M415 watchdog disposal releases installation identity when browser listener removal throws", async () => {
  const api = makeApi({ removeThrows: true });
  const controller = { async refreshListsOnce() {} };
  const first = installRefreshWatchdog({ api, controller, logger: { warn() {} } });
  await first.ready;
  assert.doesNotThrow(() => first.dispose());

  const second = installRefreshWatchdog({ api, controller, logger: { warn() {} } });
  assert.notStrictEqual(second, first);
  await second.ready;
  assert.doesNotThrow(() => second.dispose());
});

test("M415 watchdog disposal remains idempotent", async () => {
  const api = makeApi();
  const registration = installRefreshWatchdog({ api, controller: { async refreshListsOnce() {} } });
  await registration.ready;
  registration.dispose();
  assert.doesNotThrow(() => registration.dispose());
});
