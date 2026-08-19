import assert from "node:assert/strict";
import test from "node:test";

import { createImportGuardedApi } from "../src/core/import-guard.js";

function event() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

function fixture(preflight = async () => undefined) {
  const onMessage = event();
  const api = { runtime: { onMessage } };
  const guarded = createImportGuardedApi(api, { preflight });
  return { api, guarded, onMessage };
}

test("import guard contains throwing message descriptor/prototype traps", () => {
  const { guarded, onMessage } = fixture();
  let calls = 0;
  guarded.runtime.onMessage.addListener(() => { calls += 1; });
  const wrapper = [...onMessage.listeners][0];
  const descriptorTrap = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("boom"); } });
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("boom"); } });
  assert.doesNotThrow(() => wrapper(descriptorTrap, null, () => undefined));
  assert.doesNotThrow(() => wrapper(prototypeTrap, null, () => undefined));
  assert.equal(calls, 2);
});

test("import guard custom-prototype import-looking messages fall through without preflight", () => {
  let preflightCalls = 0;
  const { guarded, onMessage } = fixture(async () => { preflightCalls += 1; });
  let listenerCalls = 0;
  guarded.runtime.onMessage.addListener(() => { listenerCalls += 1; });
  const wrapper = [...onMessage.listeners][0];
  const message = Object.assign(Object.create({ custom: true }), { type: "drop-ads:import-settings", backupText: "{}" });
  wrapper(message, null, () => undefined);
  assert.equal(preflightCalls, 0);
  assert.equal(listenerCalls, 1);
});

test("import guard accepts null-prototype import messages", async () => {
  let preflightCalls = 0;
  const { guarded, onMessage } = fixture(async () => { preflightCalls += 1; });
  let listenerCalls = 0;
  guarded.runtime.onMessage.addListener(() => { listenerCalls += 1; });
  const wrapper = [...onMessage.listeners][0];
  const message = Object.assign(Object.create(null), { type: "drop-ads:import-settings", backupText: "{}" });
  assert.equal(wrapper(message, null, () => undefined), true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(preflightCalls, 1);
  assert.equal(listenerCalls, 1);
});
