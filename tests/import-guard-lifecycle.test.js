import test from "node:test";
import assert from "node:assert/strict";
import { createImportGuardedApi } from "../src/core/import-guard.js";

function event() {
  const listeners = [];
  return {
    addListener(listener) { listeners.push(listener); },
    removeListener(listener) {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    emit(...args) { return [...listeners].map((listener) => listener(...args)); },
    get count() { return listeners.length; }
  };
}

test("import guard registration is idempotent and removable", () => {
  const onMessage = event();
  const guarded = createImportGuardedApi({ runtime: { onMessage } }, { preflight: async () => {} });
  const listener = () => false;

  guarded.runtime.onMessage.addListener(listener);
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(onMessage.count, 1);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);

  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(onMessage.count, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
});

test("clean re-add still preflights imports exactly once", async () => {
  const onMessage = event();
  let preflightCalls = 0;
  let listenerCalls = 0;
  const guarded = createImportGuardedApi({ runtime: { onMessage } }, {
    preflight: async () => { preflightCalls += 1; }
  });
  const listener = (_message, _sender, sendResponse) => {
    listenerCalls += 1;
    sendResponse({ ok: true });
    return false;
  };

  guarded.runtime.onMessage.addListener(listener);
  guarded.runtime.onMessage.removeListener(listener);
  guarded.runtime.onMessage.addListener(listener);

  let response;
  onMessage.emit({ type: "drop-ads:import-settings", backupText: "{}" }, {}, (value) => { response = value; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(preflightCalls, 1);
  assert.equal(listenerCalls, 1);
  assert.deepEqual(response, { ok: true });
});

test("removed import wrapper becomes inert without underlying remove support", async () => {
  const wrappers = [];
  let preflightCalls = 0;
  let listenerCalls = 0;
  const api = { runtime: { onMessage: { addListener(listener) { wrappers.push(listener); } } } };
  const guarded = createImportGuardedApi(api, { preflight: async () => { preflightCalls += 1; } });
  const listener = () => { listenerCalls += 1; return false; };
  guarded.runtime.onMessage.addListener(listener);
  guarded.runtime.onMessage.removeListener(listener);

  wrappers[0]({ type: "drop-ads:import-settings", backupText: "{}" }, {}, () => {});
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(preflightCalls, 0);
  assert.equal(listenerCalls, 0);
});
