import assert from "node:assert/strict";
import test from "node:test";

import { sendPopupTopFrameMessage } from "../src/core/popup-boundary.js";

test("popup top-frame messaging preserves tabs receiver and frame zero", async () => {
  let seen = null;
  const tabs = Object.create(null);
  Object.defineProperty(tabs, "sendMessage", {
    enumerable: true,
    value(tabId, message, options) {
      assert.equal(this, tabs);
      seen = { tabId, message, options };
      return Promise.resolve("sent");
    }
  });
  const api = Object.create(null);
  Object.defineProperty(api, "tabs", { enumerable: true, value: tabs });
  const message = Object.freeze({ type: "drop-ads:start-element-picker" });

  assert.equal(await sendPopupTopFrameMessage(api, 42, message), "sent");
  assert.equal(seen.tabId, 42);
  assert.equal(seen.message, message);
  assert.deepEqual(seen.options, { frameId: 0 });
  assert.equal(Object.isFrozen(seen.options), true);
});

test("popup top-frame messaging rejects invalid tab ids before collaborator access", () => {
  let getterCalls = 0;
  const api = Object.create(null);
  Object.defineProperty(api, "tabs", {
    get() {
      getterCalls += 1;
      return {};
    }
  });

  assert.throws(() => sendPopupTopFrameMessage(api, -1, {}), /non-negative safe integer/);
  assert.equal(getterCalls, 0);
});

test("popup top-frame messaging rejects accessor sendMessage without executing it", () => {
  let getterCalls = 0;
  const tabs = Object.create(null);
  Object.defineProperty(tabs, "sendMessage", {
    get() {
      getterCalls += 1;
      return () => {};
    }
  });

  assert.throws(() => sendPopupTopFrameMessage({ tabs }, 1, {}), /data property/);
  assert.equal(getterCalls, 0);
});
