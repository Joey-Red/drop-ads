import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

function eventHarness() {
  const listeners = new Set();
  const event = {
    addListener(listener) { assert.equal(this, event); listeners.add(listener); },
    removeListener(listener) { assert.equal(this, event); listeners.delete(listener); }
  };
  return { event, listeners };
}

test("M463 policy convergence rejects accessor-shaped API namespaces without executing them", () => {
  let runtimeReads = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      runtimeReads += 1;
      return { onMessage: eventHarness().event };
    }
  });
  assert.throws(
    () => installPolicyConvergence({ api, controller: { syncRules() {} } }),
    /runtime namespace must be a data property/
  );
  assert.equal(runtimeReads, 0);
});

test("M463 policy convergence captures namespace events and receiver-bound listener methods", async () => {
  const runtime = eventHarness();
  const context = eventHarness();
  const alarms = eventHarness();
  const api = {
    runtime: { onMessage: runtime.event },
    contextMenus: { onClicked: context.event },
    alarms: { onAlarm: alarms.event }
  };
  const registration = installPolicyConvergence({ api, controller: { async syncRules() {} } });
  assert.equal(runtime.listeners.size, 1);
  assert.equal(context.listeners.size, 1);
  assert.equal(alarms.listeners.size, 1);
  registration.dispose();
  assert.equal(runtime.listeners.size, 0);
  assert.equal(context.listeners.size, 0);
  assert.equal(alarms.listeners.size, 0);
  await registration.whenIdle();
});

test("M463 source contains bounded descriptor/prototype namespace admission", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /function captureDataValue\(receiver, key, label\)/);
  assert.match(source, /const runtime = captureDataValue\(api, "runtime", "Policy convergence runtime namespace"\);/);
  assert.match(source, /const contextMenus = captureDataValue\(api, "contextMenus", "Policy convergence contextMenus namespace"\);/);
  assert.match(source, /const alarms = captureDataValue\(api, "alarms", "Policy convergence alarms namespace"\);/);
});
