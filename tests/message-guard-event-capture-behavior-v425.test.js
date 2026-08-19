import test from "node:test";
import assert from "node:assert/strict";
import { createMessageGuardedApi } from "../src/core/message-contract.js";

function eventProbe() {
  const added = [];
  const removed = [];
  return {
    added,
    removed,
    addListener(listener) { added.push(listener); },
    removeListener(listener) { removed.push(listener); }
  };
}

test("guard removal uses the original event after runtime.onMessage replacement", () => {
  const original = eventProbe();
  const replacement = eventProbe();
  const runtime = { onMessage: original };
  const api = { runtime };
  const guarded = createMessageGuardedApi(api, { group: "core" });

  runtime.onMessage = replacement;
  const listener = () => false;
  guarded.runtime.onMessage.addListener(listener);
  assert.equal(original.added.length, 1);
  assert.equal(replacement.added.length, 0);

  guarded.runtime.onMessage.removeListener(listener);
  assert.deepEqual(original.removed, original.added);
  assert.equal(replacement.removed.length, 0);
  assert.equal(guarded.runtime.onMessage.hasListener(listener), false);
});
