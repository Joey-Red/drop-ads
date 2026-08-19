import test from "node:test";
import assert from "node:assert/strict";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventSource() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function apiWithEvents(runtimeEvent, contextEvent = eventSource(), alarmEvent = eventSource()) {
  return {
    runtime: { onMessage: runtimeEvent },
    contextMenus: { onClicked: contextEvent },
    alarms: { onAlarm: alarmEvent }
  };
}

test("M396 event method accessors fail without executing getters", () => {
  let getterCalls = 0;
  const runtimeEvent = {};
  Object.defineProperty(runtimeEvent, "addListener", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });
  runtimeEvent.removeListener = () => {};

  assert.throws(() => installPolicyConvergence({
    api: apiWithEvents(runtimeEvent),
    controller: { syncRules() {} },
    logger: { error() {} }
  }), /data function|safely inspectable/);
  assert.equal(getterCalls, 0);
});

test("M396 teardown uses captured removers after collaborator mutation", () => {
  const removed = [];
  const runtimeEvent = eventSource();
  const contextEvent = eventSource();
  const alarmEvent = eventSource();
  runtimeEvent.removeListener = (listener) => {
    removed.push("runtime-original");
    runtimeEvent.listeners.delete(listener);
  };
  contextEvent.removeListener = (listener) => {
    removed.push("context-original");
    contextEvent.listeners.delete(listener);
  };
  alarmEvent.removeListener = (listener) => {
    removed.push("alarm-original");
    alarmEvent.listeners.delete(listener);
  };

  const api = apiWithEvents(runtimeEvent, contextEvent, alarmEvent);
  const registration = installPolicyConvergence({
    api,
    controller: { syncRules() {} },
    logger: { error() {} }
  });

  runtimeEvent.removeListener = () => removed.push("runtime-mutated");
  contextEvent.removeListener = () => removed.push("context-mutated");
  alarmEvent.removeListener = () => removed.push("alarm-mutated");
  registration.dispose();

  assert.deepEqual(removed, ["runtime-original", "context-original", "alarm-original"]);
});

test("M396 failed later listener install rolls back earlier captured installs", () => {
  const runtimeEvent = eventSource();
  let runtimeRemoved = 0;
  runtimeEvent.removeListener = (listener) => {
    runtimeRemoved += 1;
    runtimeEvent.listeners.delete(listener);
  };
  const contextEvent = eventSource();
  contextEvent.addListener = () => { throw new Error("context install failed"); };
  const alarmEvent = eventSource();

  assert.throws(() => installPolicyConvergence({
    api: apiWithEvents(runtimeEvent, contextEvent, alarmEvent),
    controller: { syncRules() {} },
    logger: { error() {} }
  }), /context install failed/);
  assert.equal(runtimeRemoved, 1);
  assert.equal(runtimeEvent.listeners.size, 0);
});
