import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function eventRecorder() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); }
  };
}

test("message guard keeps the raw onMessage event captured at construction", () => {
  const original = eventRecorder();
  const replacement = eventRecorder();
  const api = { runtime: { onMessage: original } };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  api.runtime.onMessage = replacement;

  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(original.listeners.size, 1);
  assert.equal(replacement.listeners.size, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);

  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(original.listeners.size, 0);
  assert.equal(replacement.listeners.size, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
});
