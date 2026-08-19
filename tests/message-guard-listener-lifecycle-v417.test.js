import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function browserEvent({ failFirstAdd = false, throwOnRemove = false } = {}) {
  const listeners = new Set();
  let adds = 0;
  return {
    addListener(listener) {
      adds += 1;
      if (failFirstAdd && adds === 1) throw new Error("registration failed");
      listeners.add(listener);
    },
    removeListener(listener) {
      if (throwOnRemove) throw new Error("removal failed");
      listeners.delete(listener);
    },
    emit(...args) { return [...listeners].map((listener) => listener(...args)); },
    listeners
  };
}

function guarded(event) {
  return createMessageGuardedApi({ runtime: { onMessage: event } }, { group: "core" }).runtime.onMessage;
}

test("M417 failed browser listener registration rolls logical identity back for retry", () => {
  const event = browserEvent({ failFirstAdd: true });
  const messages = guarded(event);
  const listener = () => false;
  assert.throws(() => messages.addListener(listener), /registration failed/);
  assert.equal(messages.hasListener(listener), false);
  assert.doesNotThrow(() => messages.addListener(listener));
  assert.equal(messages.hasListener(listener), true);
  assert.equal(event.listeners.size, 1);
});

test("M417 failed browser listener removal leaves retained wrapper inert and permits reinstall", () => {
  const event = browserEvent({ throwOnRemove: true });
  const messages = guarded(event);
  let calls = 0;
  const listener = () => { calls += 1; return false; };
  messages.addListener(listener);
  assert.equal(messages.hasListener(listener), true);
  assert.doesNotThrow(() => messages.removeListener(listener));
  assert.equal(messages.hasListener(listener), false);

  event.emit({ type: "drop-ads:get-ui-state" }, {}, () => undefined);
  assert.equal(calls, 0);

  assert.doesNotThrow(() => messages.addListener(listener));
  assert.equal(messages.hasListener(listener), true);
});
