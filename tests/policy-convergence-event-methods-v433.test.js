import test from "node:test";
import assert from "node:assert/strict";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

class EventSurface {
  constructor() { this.listeners = []; }
  addListener(listener) { this.listeners.push(listener); }
  removeListener(listener) { this.listeners = this.listeners.filter((item) => item !== listener); }
}

function apiWithEvents() {
  return {
    runtime: { onMessage: new EventSurface() },
    contextMenus: { onClicked: new EventSurface() },
    alarms: { onAlarm: new EventSurface() }
  };
}

test("policy convergence captures prototype event methods once for teardown", () => {
  const api = apiWithEvents();
  const controller = { syncRules: async () => {} };
  const registration = installPolicyConvergence({ api, controller, logger: { error() {} } });

  assert.equal(api.runtime.onMessage.listeners.length, 1);
  assert.equal(api.contextMenus.onClicked.listeners.length, 1);
  assert.equal(api.alarms.onAlarm.listeners.length, 1);

  api.runtime.onMessage.removeListener = () => { throw new Error("mutated runtime remover"); };
  api.contextMenus.onClicked.removeListener = () => { throw new Error("mutated context remover"); };
  api.alarms.onAlarm.removeListener = () => { throw new Error("mutated alarm remover"); };

  registration.dispose();

  assert.equal(api.runtime.onMessage.listeners.length, 0);
  assert.equal(api.contextMenus.onClicked.listeners.length, 0);
  assert.equal(api.alarms.onAlarm.listeners.length, 0);
});

test("policy convergence rejects accessor event methods without invoking getters", () => {
  let getterCalls = 0;
  const unsafeEvent = {};
  Object.defineProperty(unsafeEvent, "addListener", {
    get() {
      getterCalls += 1;
      return () => {};
    }
  });
  const api = {
    runtime: { onMessage: unsafeEvent },
    contextMenus: { onClicked: new EventSurface() },
    alarms: { onAlarm: new EventSurface() }
  };

  assert.throws(
    () => installPolicyConvergence({ api, controller: { syncRules: async () => {} }, logger: { error() {} } }),
    /addListener must be a data function/
  );
  assert.equal(getterCalls, 0);
});

test("policy convergence registration rolls back earlier captured listeners", () => {
  const runtimeEvent = new EventSurface();
  const contextEvent = new EventSurface();
  contextEvent.addListener = () => { throw new Error("registration failed"); };
  const api = {
    runtime: { onMessage: runtimeEvent },
    contextMenus: { onClicked: contextEvent },
    alarms: { onAlarm: new EventSurface() }
  };

  assert.throws(
    () => installPolicyConvergence({ api, controller: { syncRules: async () => {} }, logger: { error() {} } }),
    /registration failed/
  );
  assert.equal(runtimeEvent.listeners.length, 0);
});
