import assert from "node:assert/strict";
import test from "node:test";

import { installPolicyConvergence } from "../src/core/policy-convergence.js";

function apiHarness() {
  let adds = 0;
  const event = { addListener() { adds += 1; }, removeListener() {} };
  return {
    api: { runtime: { onMessage: event }, contextMenus: { onClicked: event }, alarms: { onAlarm: event } },
    adds: () => adds
  };
}

test("policy convergence options reject accessors without getter execution or listeners", () => {
  const h = apiHarness();
  let reads = 0;
  const options = { controller: { async syncRules() {} } };
  Object.defineProperty(options, "api", {
    enumerable: true,
    get() {
      reads += 1;
      return h.api;
    }
  });
  assert.throws(() => installPolicyConvergence(options), /Policy convergence options/);
  assert.equal(reads, 0);
  assert.equal(h.adds(), 0);
});

test("policy convergence options reject unknown/custom-prototype inputs and invalid logger", () => {
  const h = apiHarness();
  const controller = { async syncRules() {} };
  assert.throws(() => installPolicyConvergence({ api: h.api, controller, telemetry: false }), /Policy convergence options/);
  assert.throws(() => installPolicyConvergence(Object.assign(Object.create({}), { api: h.api, controller })), /Policy convergence options/);
  assert.throws(() => installPolicyConvergence({ api: h.api, controller, logger: {} }), /logger must provide error/);
  assert.equal(h.adds(), 0);
});

test("policy convergence valid/default options register once and remain idempotent", () => {
  const h = apiHarness();
  const controller = { async syncRules() {} };
  const first = installPolicyConvergence({ api: h.api, controller });
  const second = installPolicyConvergence({ api: h.api, controller });
  assert.equal(first, second);
  assert.equal(h.adds(), 3);
  first.dispose();
});
