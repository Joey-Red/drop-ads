import test from "node:test";
import assert from "node:assert/strict";
import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function eventRecord(onAdd) {
  let removed = 0;
  const event = {
    addListener(listener) {
      onAdd?.(event, listener);
    },
    removeListener() { removed += 1; }
  };
  return { event, removed: () => removed };
}

function controller() {
  return { async syncRules() {} };
}

test("M437 convergence teardown uses removers captured before registration", () => {
  const runtime = eventRecord((event) => {
    event.removeListener = () => { throw new Error("mutated remover must not run"); };
  });
  const context = eventRecord();
  const alarm = eventRecord();
  const api = {
    runtime: { onMessage: runtime.event },
    contextMenus: { onClicked: context.event },
    alarms: { onAlarm: alarm.event }
  };

  const registration = installPolicyConvergence({ api, controller: controller(), logger: { error() {} } });
  registration.dispose();
  assert.equal(runtime.removed(), 1);
  assert.equal(context.removed(), 1);
  assert.equal(alarm.removed(), 1);
});

test("M437 event method accessors are rejected without getter execution", () => {
  let getterCalls = 0;
  const runtimeEvent = { removeListener() {} };
  Object.defineProperty(runtimeEvent, "addListener", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => {};
    }
  });
  const safe = eventRecord().event;
  const api = {
    runtime: { onMessage: runtimeEvent },
    contextMenus: { onClicked: safe },
    alarms: { onAlarm: eventRecord().event }
  };

  assert.throws(
    () => installPolicyConvergence({ api, controller: controller(), logger: { error() {} } }),
    /addListener.*data function/i
  );
  assert.equal(getterCalls, 0);
});
