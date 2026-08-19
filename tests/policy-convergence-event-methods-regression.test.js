import test from "node:test";
import assert from "node:assert/strict";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventFixture({ failAdd = false } = {}) {
  const listeners = new Set();
  const event = {
    addListener(listener) {
      if (failAdd) throw new Error("add failed");
      listeners.add(listener);
    },
    removeListener(listener) { listeners.delete(listener); },
    emit(...args) { for (const listener of [...listeners]) listener(...args); }
  };
  return { event, listeners };
}

function controller() {
  return { async syncRules() {} };
}

test("teardown uses captured event removers after API method mutation", () => {
  const runtime = eventFixture();
  const context = eventFixture();
  const alarms = eventFixture();
  const api = {
    runtime: { onMessage: runtime.event },
    contextMenus: { onClicked: context.event },
    alarms: { onAlarm: alarms.event }
  };
  const registration = installPolicyConvergence({ api, controller: controller(), logger: { error() {} } });
  assert.equal(runtime.listeners.size, 1);
  assert.equal(context.listeners.size, 1);
  assert.equal(alarms.listeners.size, 1);

  runtime.event.removeListener = () => { throw new Error("mutated remover"); };
  context.event.removeListener = () => { throw new Error("mutated remover"); };
  alarms.event.removeListener = () => { throw new Error("mutated remover"); };
  registration.dispose();

  assert.equal(runtime.listeners.size, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(alarms.listeners.size, 0);
});

test("failed later listener registration rolls back earlier listeners", () => {
  const runtime = eventFixture();
  const context = eventFixture({ failAdd: true });
  const alarms = eventFixture();
  const api = {
    runtime: { onMessage: runtime.event },
    contextMenus: { onClicked: context.event },
    alarms: { onAlarm: alarms.event }
  };

  assert.throws(
    () => installPolicyConvergence({ api, controller: controller(), logger: { error() {} } }),
    /add failed/
  );
  assert.equal(runtime.listeners.size, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(alarms.listeners.size, 0);
});

test("accessor-shaped synthetic event methods are rejected without getter execution", () => {
  let getterRuns = 0;
  const badEvent = {};
  Object.defineProperty(badEvent, "addListener", {
    get() { getterRuns += 1; return () => {}; }
  });
  const api = {
    runtime: { onMessage: badEvent },
    contextMenus: { onClicked: eventFixture().event },
    alarms: { onAlarm: eventFixture().event }
  };

  assert.throws(
    () => installPolicyConvergence({ api, controller: controller(), logger: { error() {} } }),
    /addListener must be a data function/
  );
  assert.equal(getterRuns, 0);
});
