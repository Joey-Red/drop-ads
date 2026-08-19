import test from "node:test";
import assert from "node:assert/strict";
import { LIST_REFRESH_WATCHDOG_ALARM, installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function makeApi(getResult) {
  const listeners = new Set();
  const created = [];
  return { created, alarms: {
    async get() { return getResult; },
    async create(name, options) { created.push({ name, options }); },
    onAlarm: { addListener(listener) { listeners.add(listener); }, removeListener(listener) { listeners.delete(listener); } }
  } };
}

test("supporting hardening: exact watchdog alarm suppresses duplicate creation", async () => {
  const api = makeApi({ name: LIST_REFRESH_WATCHDOG_ALARM, periodInMinutes: 30 });
  const registration = installRefreshWatchdog({ api, controller: { refreshListsOnce() {} }, logger: { warn() {} } });
  assert.equal(await registration.ready, false);
  assert.deepEqual(api.created, []);
  registration.dispose();
});

test("supporting hardening: absent watchdog creates the persistent alarm", async () => {
  const api = makeApi(undefined);
  const registration = installRefreshWatchdog({ api, controller: { refreshListsOnce() {} }, logger: { warn() {} } });
  assert.equal(await registration.ready, true);
  assert.deepEqual(api.created, [{ name: LIST_REFRESH_WATCHDOG_ALARM, options: { periodInMinutes: 30 } }]);
  registration.dispose();
});

test("supporting hardening: malformed lookup never executes name getters", async () => {
  let getterCalls = 0;
  let warnings = 0;
  const result = {};
  Object.defineProperty(result, "name", { enumerable: true, get() { getterCalls += 1; return LIST_REFRESH_WATCHDOG_ALARM; } });
  const api = makeApi(result);
  const registration = installRefreshWatchdog({ api, controller: { refreshListsOnce() {} }, logger: { warn() { warnings += 1; } } });
  assert.equal(await registration.ready, false);
  assert.equal(getterCalls, 0);
  assert.equal(warnings, 1);
  assert.deepEqual(api.created, []);
  registration.dispose();
});

test("supporting hardening: wrong-name lookup cannot silently suppress readiness", async () => {
  let warnings = 0;
  const api = makeApi({ name: "other-extension-alarm" });
  const registration = installRefreshWatchdog({ api, controller: { refreshListsOnce() {} }, logger: { warn() { warnings += 1; } } });
  assert.equal(await registration.ready, false);
  assert.equal(warnings, 1);
  assert.deepEqual(api.created, []);
  registration.dispose();
});
