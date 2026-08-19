import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

class EventSource {
  constructor() { this.listeners = new Set(); }
  addListener(listener) {
    assert.equal(this instanceof EventSource, true);
    this.listeners.add(listener);
  }
  removeListener(listener) {
    assert.equal(this instanceof EventSource, true);
    this.listeners.delete(listener);
  }
}

function apiWithEvents() {
  return {
    runtime: { onMessage: new EventSource() },
    contextMenus: { onClicked: new EventSource() },
    alarms: { onAlarm: new EventSource() }
  };
}

test("M430 convergence captures prototype event methods with original receivers", () => {
  const api = apiWithEvents();
  const controller = { async syncRules() {} };
  const registration = installPolicyConvergence({ api, controller });
  assert.equal(api.runtime.onMessage.listeners.size, 1);
  assert.equal(api.contextMenus.onClicked.listeners.size, 1);
  assert.equal(api.alarms.onAlarm.listeners.size, 1);

  api.runtime.onMessage.removeListener = () => { throw new Error("late mutation"); };
  api.contextMenus.onClicked.removeListener = () => { throw new Error("late mutation"); };
  api.alarms.onAlarm.removeListener = () => { throw new Error("late mutation"); };
  assert.doesNotThrow(() => registration.dispose());
});

test("M430 accessor-backed event methods are rejected without invoking getters", () => {
  let getterCalls = 0;
  const badEvent = {};
  Object.defineProperty(badEvent, "addListener", {
    get() { getterCalls += 1; return () => {}; }
  });
  const api = apiWithEvents();
  api.runtime.onMessage = badEvent;
  assert.throws(() => installPolicyConvergence({ api, controller: { async syncRules() {} } }), /data function/);
  assert.equal(getterCalls, 0);
});
