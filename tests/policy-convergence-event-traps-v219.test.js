import assert from "node:assert/strict";
import test from "node:test";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function event() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function fixture() {
  const runtime = event();
  const menu = event();
  const alarms = event();
  const calls = [];
  return {
    calls,
    api: { runtime: { onMessage: runtime }, contextMenus: { onClicked: menu }, alarms: { onAlarm: alarms } },
    controller: { async syncRules() { calls.push("sync"); } },
    events: { runtime, menu, alarms }
  };
}

test("policy convergence contains throwing event traps", () => {
  const { api, controller, events, calls } = fixture();
  const registration = installPolicyConvergence({ api, controller });
  const hostileDescriptor = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("boom"); } });
  const hostilePrototype = new Proxy({}, { getPrototypeOf() { throw new Error("boom"); } });
  assert.doesNotThrow(() => [...events.runtime.listeners][0](hostileDescriptor));
  assert.doesNotThrow(() => [...events.menu.listeners][0](hostilePrototype));
  assert.deepEqual(calls, []);
  registration.dispose();
});

test("policy convergence ignores custom prototypes and accepts null-prototype events", async () => {
  const { api, controller, events, calls } = fixture();
  const registration = installPolicyConvergence({ api, controller });
  [...events.runtime.listeners][0](Object.assign(Object.create({ custom: true }), { type: "drop-ads:set-enabled" }));
  assert.deepEqual(calls, []);
  [...events.runtime.listeners][0](Object.assign(Object.create(null), { type: "drop-ads:set-enabled" }));
  await registration.whenIdle();
  assert.deepEqual(calls, ["sync"]);
  registration.dispose();
});
