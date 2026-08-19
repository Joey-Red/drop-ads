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

test("M422 guarded runtime messages stay attached to the event captured at construction", () => {
  const first = eventRecorder();
  const replacement = eventRecorder();
  const api = { runtime: { onMessage: first } };
  const guarded = createMessageGuardedApi(api, { group: "core" });

  api.runtime.onMessage = replacement;
  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);

  assert.equal(first.listeners.size, 1);
  assert.equal(replacement.listeners.size, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), true);

  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(first.listeners.size, 0);
  assert.equal(replacement.listeners.size, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
});

test("M422 guard construction rejects an unusable initial onMessage event", () => {
  assert.throws(
    () => createMessageGuardedApi({ runtime: { onMessage: {} } }, { group: "core" }),
    /runtime\.onMessage\.addListener.*unavailable/i
  );
});
