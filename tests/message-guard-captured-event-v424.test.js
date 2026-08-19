import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function eventChannel() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    listeners
  };
}

test("message guard keeps the onMessage event captured at guard creation", () => {
  const original = eventChannel();
  const replacement = eventChannel();
  const runtime = { onMessage: original };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  runtime.onMessage = replacement;

  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(original.listeners.size, 1);
  assert.equal(replacement.listeners.size, 0);

  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(original.listeners.size, 0);
  assert.equal(replacement.listeners.size, 0);
});
