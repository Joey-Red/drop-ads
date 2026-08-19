import test from "node:test";
import assert from "node:assert/strict";

import { createImportGuardedApi } from "../src/core/import-guard.js";

function makeEvent({ failAdd = false, failRemove = false } = {}) {
  let registered = null;
  const event = {
    addListener(listener) {
      assert.equal(this, event);
      if (failAdd) throw new Error("add failed");
      registered = listener;
    },
    removeListener(listener) {
      assert.equal(this, event);
      if (failRemove) throw new Error("remove failed");
      if (registered === listener) registered = null;
    }
  };
  for (const key of ["addListener", "removeListener"]) {
    Object.defineProperty(event[key], "bind", {
      configurable: true,
      get() { throw new Error("callback-owned bind must not be read"); }
    });
  }
  return { event, registered: () => registered };
}

test("M449 import guard captures event methods and preserves listener identity", () => {
  const harness = makeEvent();
  const runtime = { onMessage: harness.event };
  const guarded = createImportGuardedApi({ runtime }, { preflight: () => undefined });
  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);
  assert.equal(typeof harness.registered(), "function");
  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
  assert.equal(harness.registered(), null);
});

test("M449 failed browser registration rolls back logical identity", () => {
  const harness = makeEvent({ failAdd: true });
  const guarded = createImportGuardedApi({ runtime: { onMessage: harness.event } }, { preflight: () => undefined });
  const listener = () => false;
  assert.throws(() => guarded.runtime.onMessage.addListener(listener), /add failed/);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
});

test("M449 failed browser removal leaves stale wrapper inert", () => {
  const harness = makeEvent({ failRemove: true });
  const guarded = createImportGuardedApi({ runtime: { onMessage: harness.event } }, { preflight: () => undefined });
  let calls = 0;
  const listener = () => { calls += 1; return true; };
  guarded.runtime.onMessage.addListener(listener);
  const stale = harness.registered();
  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
  assert.equal(stale({ type: "other" }, {}, () => undefined), false);
  assert.equal(calls, 0);
});

test("M449 forwarded runtime methods use original receiver without callback-owned bind", () => {
  const harness = makeEvent();
  function getURL(path) {
    assert.equal(this, runtime);
    return `extension://${path}`;
  }
  Object.defineProperty(getURL, "bind", {
    configurable: true,
    get() { throw new Error("bind must not be read"); }
  });
  const runtime = { onMessage: harness.event, getURL };
  const guarded = createImportGuardedApi({ runtime }, { preflight: () => undefined });
  assert.equal(guarded.runtime.getURL("x"), "extension://x");
});
