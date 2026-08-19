import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

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

function fixture() {
  const onMessage = event();
  const api = { runtime: { onMessage } };
  return { api, onMessage };
}

test("guarded runtime handler registration is identity-preserving and idempotent", () => {
  const fx = fixture();
  const guarded = createMessageGuardedApi(fx.api, { group: "core" });
  const listener = () => false;

  guarded.runtime.onMessage.addListener(listener);
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(fx.onMessage.count, 1);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);
});

test("guarded runtime handler removal detaches exact wrapper and supports clean re-add", () => {
  const fx = fixture();
  const guarded = createMessageGuardedApi(fx.api, { group: "core" });
  let calls = 0;
  const listener = () => { calls += 1; return false; };

  guarded.runtime.onMessage.addListener(listener);
  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(fx.onMessage.count, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);

  guarded.runtime.onMessage.addListener(listener);
  assert.equal(fx.onMessage.count, 1);
  fx.onMessage.emit({ type: "drop-ads:get-ui-state" }, {}, () => {});
  assert.equal(calls, 1);
});

test("removed wrapper becomes inert even when the underlying event lacks removeListener", () => {
  const listeners = [];
  const api = { runtime: { onMessage: { addListener(listener) { listeners.push(listener); } } } };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  let calls = 0;
  const listener = () => { calls += 1; return false; };
  guarded.runtime.onMessage.addListener(listener);
  guarded.runtime.onMessage.removeListener(listener);
  listeners[0]({ type: "drop-ads:get-ui-state" }, {}, () => {});
  assert.equal(calls, 0);
});
