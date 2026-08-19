import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventFixture() {
  const listeners = new Set();
  const proto = {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
  const event = Object.create(proto);
  return { event, listeners };
}

test("policy convergence captures prototype listener methods once for install and teardown", () => {
  const runtime = eventFixture();
  const context = eventFixture();
  const alarms = eventFixture();
  const api = {
    runtime: { onMessage: runtime.event },
    contextMenus: { onClicked: context.event },
    alarms: { onAlarm: alarms.event }
  };

  const registration = installPolicyConvergence({
    api,
    controller: { syncRules() {} },
    logger: { error() {} }
  });

  assert.equal(runtime.listeners.size, 1);
  assert.equal(context.listeners.size, 1);
  assert.equal(alarms.listeners.size, 1);

  for (const fixture of [runtime, context, alarms]) {
    Object.defineProperty(fixture.event, "removeListener", {
      configurable: true,
      get() { throw new Error("late removeListener getter must not run"); }
    });
  }

  registration.dispose();
  assert.equal(runtime.listeners.size, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(alarms.listeners.size, 0);
});

test("failed listener registration rolls back earlier captured registrations", () => {
  const runtime = eventFixture();
  const context = eventFixture();
  const alarms = eventFixture();
  Object.defineProperty(context.event, "addListener", {
    configurable: true,
    enumerable: true,
    value() { throw new Error("registration failure"); }
  });

  assert.throws(() => installPolicyConvergence({
    api: {
      runtime: { onMessage: runtime.event },
      contextMenus: { onClicked: context.event },
      alarms: { onAlarm: alarms.event }
    },
    controller: { syncRules() {} },
    logger: { error() {} }
  }), /registration failure/);

  assert.equal(runtime.listeners.size, 0);
  assert.equal(alarms.listeners.size, 0);
});
