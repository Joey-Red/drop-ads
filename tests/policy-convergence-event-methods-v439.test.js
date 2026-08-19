import test from "node:test";
import assert from "node:assert/strict";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventHarness({ throwAfterAdd = false } = {}) {
  const listeners = new Set();
  const prototype = {};
  Object.defineProperties(prototype, {
    addListener: {
      value(listener) {
        listeners.add(listener);
        if (throwAfterAdd) throw new Error("registration failed");
      },
      configurable: true
    },
    removeListener: {
      value(listener) {
        listeners.delete(listener);
      },
      configurable: true
    }
  });
  return { event: Object.create(prototype), listeners, prototype };
}

function runtimeOptions(events) {
  return {
    api: {
      runtime: { onMessage: events.runtime.event },
      contextMenus: { onClicked: events.context.event },
      alarms: { onAlarm: events.alarm.event }
    },
    controller: { syncRules: async () => {} },
    logger: { error() {} }
  };
}

test("M439 policy convergence disposal uses captured event removers after mutation", () => {
  const events = {
    runtime: eventHarness(),
    context: eventHarness(),
    alarm: eventHarness()
  };
  const registration = installPolicyConvergence(runtimeOptions(events));
  assert.deepEqual([
    events.runtime.listeners.size,
    events.context.listeners.size,
    events.alarm.listeners.size
  ], [1, 1, 1]);

  for (const source of Object.values(events)) {
    Object.defineProperty(source.event, "removeListener", {
      configurable: true,
      get() {
        throw new Error("mutated removeListener must not be read");
      }
    });
  }

  registration.dispose();
  assert.deepEqual([
    events.runtime.listeners.size,
    events.context.listeners.size,
    events.alarm.listeners.size
  ], [0, 0, 0]);
});

test("M439 policy convergence listener installation rolls back earlier and add-then-throw listeners", () => {
  const events = {
    runtime: eventHarness(),
    context: eventHarness({ throwAfterAdd: true }),
    alarm: eventHarness()
  };

  assert.throws(() => installPolicyConvergence(runtimeOptions(events)), /registration failed/);
  assert.deepEqual([
    events.runtime.listeners.size,
    events.context.listeners.size,
    events.alarm.listeners.size
  ], [0, 0, 0]);
});
