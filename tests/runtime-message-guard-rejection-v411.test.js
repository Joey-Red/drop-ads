import test from "node:test";
import assert from "node:assert/strict";

import {
  createMessageGuardedApi,
  MAX_RUNTIME_MESSAGE_ERROR_CHARS
} from "../src/core/message-contract.js";

function makeApi() {
  let listener = null;
  const api = {
    runtime: {
      onMessage: {
        addListener(value) { listener = value; },
        removeListener(value) { if (listener === value) listener = null; }
      }
    }
  };
  return { api, listener: () => listener };
}

test("M411 guard-generated rejection text is bounded as a complete response", () => {
  const harness = makeApi();
  const guarded = createMessageGuardedApi(harness.api, { group: "core" });
  guarded.runtime.onMessage.addListener(() => false);

  const message = { type: "drop-ads:get-ui-state" };
  message["x".repeat(MAX_RUNTIME_MESSAGE_ERROR_CHARS * 2)] = true;
  let response = null;
  const handled = harness.listener()(message, {}, (value) => { response = value; });

  assert.equal(handled, true);
  assert.equal(response.ok, false);
  assert.ok(response.error.length <= MAX_RUNTIME_MESSAGE_ERROR_CHARS);
  assert.equal(response.error, "Invalid runtime message: validation failed");
});

test("M411 guard-generated rejection contains a throwing response channel", () => {
  const harness = makeApi();
  const guarded = createMessageGuardedApi(harness.api, { group: "core" });
  guarded.runtime.onMessage.addListener(() => false);

  assert.doesNotThrow(() => {
    const handled = harness.listener()(
      { type: "drop-ads:set-enabled", enabled: "yes" },
      {},
      () => { throw new Error("closed response channel"); }
    );
    assert.equal(handled, true);
  });
});
