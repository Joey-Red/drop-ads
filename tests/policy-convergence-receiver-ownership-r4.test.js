import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function poisonedBind(callback) {
  Object.defineProperty(callback, "bind", {
    configurable: true,
    get() {
      throw new Error("callback-owned bind must not be read");
    }
  });
  return callback;
}

function eventHarness() {
  const listeners = new Set();
  const event = {};
  const prototype = {
    addListener: poisonedBind(function addListener(listener) {
      assert.equal(this, event);
      listeners.add(listener);
    }),
    removeListener: poisonedBind(function removeListener(listener) {
      assert.equal(this, event);
      listeners.delete(listener);
    })
  };
  Object.setPrototypeOf(event, prototype);
  return { event, listeners };
}

test("R4 policy convergence preserves controller and event receivers without callback.bind", async () => {
  const runtime = eventHarness();
  const context = eventHarness();
  const alarm = eventHarness();
  const api = Object.create({
    runtime: Object.create({ onMessage: runtime.event }),
    contextMenus: Object.create({ onClicked: context.event }),
    alarms: Object.create({ onAlarm: alarm.event })
  });

  let syncReceiver = null;
  const syncRules = poisonedBind(function syncRules() {
    syncReceiver = this;
  });
  const controller = { syncRules };
  const registration = installPolicyConvergence({ api, controller });

  assert.equal(runtime.listeners.size, 1);
  assert.equal(context.listeners.size, 1);
  assert.equal(alarm.listeners.size, 1);
  await registration.queueConvergence("receiver ownership verification");
  await registration.whenIdle();
  assert.equal(syncReceiver, controller);

  registration.dispose();
  assert.equal(runtime.listeners.size, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(alarm.listeners.size, 0);
});

test("R4 policy convergence rejects accessor namespaces without executing them", () => {
  let runtimeGets = 0;
  const api = {
    contextMenus: { onClicked: eventHarness().event },
    alarms: { onAlarm: eventHarness().event }
  };
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      runtimeGets += 1;
      return { onMessage: eventHarness().event };
    }
  });
  assert.throws(
    () => installPolicyConvergence({ api, controller: { syncRules() {} } }),
    /data property/
  );
  assert.equal(runtimeGets, 0);
});
