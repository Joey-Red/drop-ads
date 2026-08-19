import assert from "node:assert/strict";
import test from "node:test";

import { sendPopupRuntimeMessage } from "../src/core/popup-boundary.js";

test("popup runtime message preserves the runtime receiver", async () => {
  const runtime = Object.create(null);
  const message = Object.freeze({ type: "drop-ads:get-ui-state" });
  Object.defineProperty(runtime, "sendMessage", {
    enumerable: true,
    value(received) {
      assert.equal(this, runtime);
      assert.equal(received, message);
      return Promise.resolve({ ok: true });
    }
  });
  const api = Object.create(null);
  Object.defineProperty(api, "runtime", { enumerable: true, value: runtime });

  assert.deepEqual(await sendPopupRuntimeMessage(api, message), { ok: true });
});

test("popup runtime message rejects accessor runtime without executing it", () => {
  let getterCalls = 0;
  const api = Object.create(null);
  Object.defineProperty(api, "runtime", {
    get() {
      getterCalls += 1;
      return {};
    }
  });

  assert.throws(() => sendPopupRuntimeMessage(api, {}), /data property/);
  assert.equal(getterCalls, 0);
});

test("popup runtime message rejects non-function sendMessage", () => {
  assert.throws(() => sendPopupRuntimeMessage({ runtime: { sendMessage: null } }, {}), /must be a data function/);
});
