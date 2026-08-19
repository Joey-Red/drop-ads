import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventSurface() {
  const listeners = new Set();
  const event = {
    listeners,
    addListener(listener) {
      assert.equal(this, event);
      listeners.add(listener);
    },
    removeListener(listener) {
      assert.equal(this, event);
      listeners.delete(listener);
    }
  };
  Object.defineProperty(event.addListener, "bind", { get() { throw new Error("bind must not be read"); } });
  Object.defineProperty(event.removeListener, "bind", { get() { throw new Error("bind must not be read"); } });
  return event;
}

test("R4 policy convergence preserves controller and event receivers without callback-owned bind", async () => {
  const runtimeEvent = eventSurface();
  const contextEvent = eventSurface();
  const alarmEvent = eventSurface();
  const api = {
    runtime: { onMessage: runtimeEvent },
    contextMenus: { onClicked: contextEvent },
    alarms: { onAlarm: alarmEvent }
  };
  const controller = { calls: 0 };
  function syncRules() {
    assert.equal(this, controller);
    this.calls += 1;
  }
  Object.defineProperty(syncRules, "bind", { get() { throw new Error("bind must not be read"); } });
  controller.syncRules = syncRules;

  const registration = installPolicyConvergence({ api, controller });
  await registration.queueConvergence("ownership verification");
  assert.equal(controller.calls, 1);
  registration.dispose();
  assert.equal(runtimeEvent.listeners.size, 0);
  assert.equal(contextEvent.listeners.size, 0);
  assert.equal(alarmEvent.listeners.size, 0);
});

test("R4 policy convergence rejects accessor browser namespaces without executing them", () => {
  let getterCalls = 0;
  const api = {
    contextMenus: { onClicked: eventSurface() },
    alarms: { onAlarm: eventSurface() }
  };
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() { getterCalls += 1; return { onMessage: eventSurface() }; }
  });
  assert.throws(() => installPolicyConvergence({ api, controller: { syncRules() {} } }), /data property/);
  assert.equal(getterCalls, 0);
});
