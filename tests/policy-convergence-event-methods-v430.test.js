import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventStub() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function apiWithEvents(runtimeMessage = eventStub(), contextClicked = eventStub(), alarm = eventStub()) {
  return {
    api: {
      runtime: { onMessage: runtimeMessage },
      contextMenus: { onClicked: contextClicked },
      alarms: { onAlarm: alarm }
    },
    runtimeMessage,
    contextClicked,
    alarm
  };
}

const controller = { async syncRules() {} };

test("M430 convergence event method accessors are rejected without getter execution", () => {
  let getterCalls = 0;
  const hostile = {};
  Object.defineProperty(hostile, "addListener", {
    enumerable: true,
    get() { getterCalls += 1; return () => {}; }
  });
  const harness = apiWithEvents(hostile);
  assert.throws(
    () => installPolicyConvergence({ api: harness.api, controller }),
    /runtime\.onMessage\.addListener must be a data function/
  );
  assert.equal(getterCalls, 0);
});

test("M430 disposal uses removers captured before event-method mutation", () => {
  const harness = apiWithEvents();
  let runtimeRemovals = 0;
  const originalRuntimeRemove = harness.runtimeMessage.removeListener;
  harness.runtimeMessage.removeListener = function remove(listener) {
    runtimeRemovals += 1;
    originalRuntimeRemove.call(this, listener);
  };
  const registration = installPolicyConvergence({ api: harness.api, controller });
  assert.equal(harness.runtimeMessage.listeners.size, 1);
  assert.equal(harness.contextClicked.listeners.size, 1);
  assert.equal(harness.alarm.listeners.size, 1);

  harness.runtimeMessage.removeListener = () => { throw new Error("mutated remover must not run"); };
  assert.doesNotThrow(() => registration.dispose());
  assert.equal(runtimeRemovals, 1);
  assert.equal(harness.runtimeMessage.listeners.size, 0);
  assert.equal(harness.contextClicked.listeners.size, 0);
  assert.equal(harness.alarm.listeners.size, 0);
});

test("M430 add-then-throw registration rolls back the current and earlier events", () => {
  const runtimeMessage = eventStub();
  const contextClicked = eventStub();
  const alarm = eventStub();
  contextClicked.addListener = function addThenThrow(listener) {
    this.listeners.add(listener);
    throw new Error("context registration failed");
  };
  const harness = apiWithEvents(runtimeMessage, contextClicked, alarm);
  assert.throws(
    () => installPolicyConvergence({ api: harness.api, controller }),
    /context registration failed/
  );
  assert.equal(runtimeMessage.listeners.size, 0);
  assert.equal(contextClicked.listeners.size, 0);
  assert.equal(alarm.listeners.size, 0);
});
