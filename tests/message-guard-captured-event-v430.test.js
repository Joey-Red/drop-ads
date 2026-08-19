import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function eventSource() {
  const listeners = new Set();
  return {
    listeners,
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    emit(message) {
      for (const listener of [...listeners]) listener(message, {}, () => undefined);
    }
  };
}

test("M430 guarded runtime captures the original onMessage event for add/remove", () => {
  const first = eventSource();
  const replacement = eventSource();
  const runtime = { onMessage: first };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  let calls = 0;
  const listener = () => { calls += 1; return false; };

  runtime.onMessage = replacement;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(first.listeners.size, 1);
  assert.equal(replacement.listeners.size, 0);

  first.emit({ type: "drop-ads:get-ui-state" });
  assert.equal(calls, 1);

  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(first.listeners.size, 0);
  assert.equal(replacement.listeners.size, 0);
});

test("M430 guarded runtime still forwards current non-onMessage runtime properties", () => {
  const first = eventSource();
  const runtime = {
    onMessage: first,
    getURL(path) { return `moz-extension://test/${path}`; }
  };
  const guarded = createMessageGuardedApi({ runtime }, { group: "core" });
  assert.equal(guarded.runtime.getURL("x"), "moz-extension://test/x");
});
