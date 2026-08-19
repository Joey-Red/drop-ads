import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

test("M431 watchdog ready awaits promise-returning alarm creation", async () => {
  const onAlarm = eventSource();
  let releaseCreate;
  const createPromise = new Promise((resolve) => { releaseCreate = resolve; });
  const api = { alarms: { onAlarm, get() { return null; }, create() { return createPromise; } } };
  const registration = installRefreshWatchdog({ api, controller: { async refreshListsOnce() {} } });

  let settled = false;
  registration.ready.then(() => { settled = true; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(settled, false);
  releaseCreate();
  assert.equal(await registration.ready, true);
  registration.dispose();
});

test("M431 watchdog ready contains asynchronous alarm creation rejection", async () => {
  const onAlarm = eventSource();
  const warnings = [];
  const api = { alarms: { onAlarm, get() { return null; }, create() { return Promise.reject(new Error("synthetic create failure")); } } };
  const registration = installRefreshWatchdog({
    api,
    controller: { async refreshListsOnce() {} },
    logger: { warn(...args) { warnings.push(args); } }
  });

  assert.equal(await registration.ready, false);
  assert.equal(warnings.length, 1);
  registration.dispose();
});
