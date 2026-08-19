import test from "node:test";
import assert from "node:assert/strict";

import { createImportGuardedApi } from "../src/core/import-guard.js";

function runtimeHarness() {
  const listeners = new Set();
  const onMessage = {
    addListener(listener) {
      assert.equal(this, onMessage);
      listeners.add(listener);
    },
    removeListener(listener) {
      assert.equal(this, onMessage);
      listeners.delete(listener);
    }
  };
  const runtime = {
    onMessage,
    ping(value) {
      assert.equal(this, runtime);
      return `pong:${value}`;
    }
  };
  return { runtime, onMessage, listeners };
}

test("M461 captured import-guard listener operations retain original event ownership", () => {
  const { runtime, onMessage, listeners } = runtimeHarness();
  const guarded = createImportGuardedApi({ runtime }, { preflight: async () => [] });
  const messages = guarded.runtime.onMessage;
  onMessage.addListener = () => { throw new Error("mutated addListener must not run"); };
  onMessage.removeListener = () => { throw new Error("mutated removeListener must not run"); };

  const listener = () => false;
  messages.addListener(listener);
  assert.equal(listeners.size, 1);
  messages.removeListener(listener);
  assert.equal(listeners.size, 0);
});

test("M461 forwarded runtime methods preserve receiver without reading callback bind", () => {
  const { runtime } = runtimeHarness();
  let bindReads = 0;
  Object.defineProperty(runtime.ping, "bind", {
    configurable: true,
    get() {
      bindReads += 1;
      throw new Error("callback bind must not be read");
    }
  });
  const guarded = createImportGuardedApi({ runtime }, { preflight: async () => [] });
  assert.equal(guarded.runtime.ping("x"), "pong:x");
  assert.equal(bindReads, 0);
});

test("M461 accessor-backed runtime namespace is rejected without getter execution", () => {
  let getterRuns = 0;
  const api = {};
  Object.defineProperty(api, "runtime", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return runtimeHarness().runtime;
    }
  });

  assert.throws(
    () => createImportGuardedApi(api, { preflight: async () => [] }),
    /Import guard runtime.*data property/i
  );
  assert.equal(getterRuns, 0);
});
