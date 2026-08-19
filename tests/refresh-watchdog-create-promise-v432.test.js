import test from "node:test";
import assert from "node:assert/strict";
import { installRefreshWatchdog } from "../src/core/refresh-watchdog.js";

function baseApi(create) {
  const listeners = new Set();
  return {
    alarms: {
      onAlarm: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); }
      },
      async get() { return null; },
      create
    }
  };
}

const controller = { refreshListsOnce() {} };

test("watchdog ready waits for promise-returning alarm creation", async () => {
  let resolveCreate;
  const api = baseApi(() => new Promise((resolve) => { resolveCreate = resolve; }));
  const installation = installRefreshWatchdog({ api, controller });
  let settled = false;
  void installation.ready.then(() => { settled = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(typeof resolveCreate, "function");
  assert.equal(settled, false);
  resolveCreate();
  assert.equal(await installation.ready, true);
  installation.dispose();
});

test("watchdog ready contains asynchronous alarm creation rejection", async () => {
  const warnings = [];
  const api = baseApi(() => Promise.reject(new Error("create failed")));
  const installation = installRefreshWatchdog({
    api,
    controller,
    logger: { warn(...args) { warnings.push(args); } }
  });
  assert.equal(await installation.ready, false);
  assert.equal(warnings.length, 1);
  installation.dispose();
});

test("watchdog ready reports false if disposed before asynchronous creation finishes", async () => {
  let resolveCreate;
  const api = baseApi(() => new Promise((resolve) => { resolveCreate = resolve; }));
  const installation = installRefreshWatchdog({ api, controller });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(typeof resolveCreate, "function");
  installation.dispose();
  resolveCreate();
  assert.equal(await installation.ready, false);
});
