import test from "node:test";
import assert from "node:assert/strict";
import {
  createMessageGuardedApi,
  MAX_RUNTIME_MESSAGE_ERROR_CHARS
} from "../src/core/message-contract.js";

function runtimeHarness() {
  let wrapper = null;
  const onMessage = {
    addListener(listener) { wrapper = listener; },
    removeListener(listener) { if (wrapper === listener) wrapper = null; }
  };
  return {
    api: { runtime: { onMessage } },
    emit(message, sendResponse) { return wrapper(message, {}, sendResponse); }
  };
}

test("M414 guard-generated rejection text stays inside the complete 1024-character ceiling", () => {
  const harness = runtimeHarness();
  const guarded = createMessageGuardedApi(harness.api, { group: "core" });
  guarded.runtime.onMessage.addListener(() => false);

  let response = null;
  const handled = harness.emit({ type: "x".repeat(65) }, (value) => { response = value; });
  assert.equal(handled, true);
  assert.equal(response.ok, false);
  assert.equal(typeof response.error, "string");
  assert.ok(response.error.length <= MAX_RUNTIME_MESSAGE_ERROR_CHARS);
  assert.match(response.error, /^Invalid runtime message: /);
});

test("M414 guard-generated rejection contains a throwing response channel", () => {
  const harness = runtimeHarness();
  const guarded = createMessageGuardedApi(harness.api, { group: "core" });
  guarded.runtime.onMessage.addListener(() => false);

  assert.doesNotThrow(() => {
    const handled = harness.emit({ type: "unknown-action" }, () => {
      throw new Error("closed response channel");
    });
    assert.equal(handled, true);
  });
});
