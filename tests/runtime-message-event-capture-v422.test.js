import test from "node:test";
import assert from "node:assert/strict";

import { createMessageGuardedApi } from "../src/core/message-contract.js";

function eventSource() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(...args) { for (const listener of [...listeners]) listener(...args); },
    listeners
  };
}

test("M422 message guard retains the raw onMessage event captured at creation", () => {
  const original = eventSource();
  const replacement = eventSource();
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

test("M422 message guard validates the captured event before exposure", () => {
  assert.throws(
    () => createMessageGuardedApi({ runtime: { onMessage: {} } }, { group: "core" }),
    /runtime\.onMessage\.addListener.*unavailable/i
  );
});
