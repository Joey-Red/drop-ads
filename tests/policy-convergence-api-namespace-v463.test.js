import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function event() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    listeners
  };
}

function safeApi() {
  return {
    runtime: { onMessage: event() },
    contextMenus: { onClicked: event() },
    alarms: { onAlarm: event() }
  };
}

test("M463 rejects accessor-shaped API namespaces without executing them", () => {
  let getterCalls = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() { getterCalls += 1; return { onMessage: event() }; }
  });
  Object.defineProperty(api, "contextMenus", { enumerable: true, value: { onClicked: event() } });
  Object.defineProperty(api, "alarms", { enumerable: true, value: { onAlarm: event() } });

  assert.throws(
    () => installPolicyConvergence({ api, controller: { syncRules() {} } }),
    /runtime namespace must be a data property/
  );
  assert.equal(getterCalls, 0);
});

test("M463 accepts namespace/event data properties inherited within the reviewed depth", () => {
  const runtimeEvent = event();
  const contextEvent = event();
  const alarmEvent = event();
  const apiPrototype = {
    runtime: Object.create({ onMessage: runtimeEvent }),
    contextMenus: Object.create({ onClicked: contextEvent }),
    alarms: Object.create({ onAlarm: alarmEvent })
  };
  const api = Object.create(apiPrototype);
  const registration = installPolicyConvergence({ api, controller: { syncRules() {} } });

  assert.equal(runtimeEvent.listeners.size, 1);
  assert.equal(contextEvent.listeners.size, 1);
  assert.equal(alarmEvent.listeners.size, 1);
  registration.dispose();
  assert.equal(runtimeEvent.listeners.size, 0);
  assert.equal(contextEvent.listeners.size, 0);
  assert.equal(alarmEvent.listeners.size, 0);
});
