import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function makeEvent() {
  const listeners = new Set();
  return {
    addListener(listener) { listeners.add(listener); },
    removeListener(listener) { listeners.delete(listener); },
    has(listener) { return listeners.has(listener); },
    size() { return listeners.size; }
  };
}

test("M422 message guard keeps the raw onMessage event captured at creation", () => {
  const original = makeEvent();
  const replacement = makeEvent();
  const runtime = { onMessage: original };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });
  const listener = () => false;

  runtime.onMessage = replacement;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(original.size(), 1);
  assert.equal(replacement.size(), 0);

  guarded.runtime.onMessage.removeListener(listener);
  assert.equal(original.size(), 0);
  assert.equal(replacement.size(), 0);
});

test("M422 guard creation rejects a raw message event without addListener", () => {
  assert.throws(
    () => createMessageGuardedApi({ runtime: { onMessage: {} } }, { group: "core" }),
    /runtime\.onMessage\.addListener.*unavailable/i
  );
});
