import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventSource({ failAdd = false } = {}) {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) {
      if (failAdd) throw new Error("add failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      listeners.delete(listener);
    }
  };
}

function makeApi(contextOptions = {}) {
  return {
    runtime: { onMessage: eventSource() },
    contextMenus: { onClicked: eventSource(contextOptions) },
    alarms: { onAlarm: eventSource() }
  };
}

const controller = { async syncRules() {} };

test("M411 rolls back earlier policy-convergence listeners when a later add fails", () => {
  const api = makeApi({ failAdd: true });
  assert.throws(() => installPolicyConvergence({ api, controller }), /add failed/);
  assert.equal(api.runtime.onMessage.listeners.size, 0);
  assert.equal(api.contextMenus.onClicked.listeners.size, 0);
  assert.equal(api.alarms.onAlarm.listeners.size, 0);
});

test("M411 teardown uses captured event collaborators after API namespace replacement", () => {
  const api = makeApi();
  const originalRuntimeEvent = api.runtime.onMessage;
  const originalContextEvent = api.contextMenus.onClicked;
  const originalAlarmEvent = api.alarms.onAlarm;
  const registration = installPolicyConvergence({ api, controller });

  api.runtime.onMessage = eventSource();
  api.contextMenus.onClicked = eventSource();
  api.alarms.onAlarm = eventSource();
  registration.dispose();

  assert.equal(originalRuntimeEvent.listeners.size, 0);
  assert.equal(originalContextEvent.listeners.size, 0);
  assert.equal(originalAlarmEvent.listeners.size, 0);
});
