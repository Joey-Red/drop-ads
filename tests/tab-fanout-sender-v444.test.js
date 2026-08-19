import test from "node:test";
import assert from "node:assert/strict";

import { MAX_TAB_MESSAGE_CONCURRENCY, sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("M444 tab fanout invokes captured sender with receiver identity and ignores callback-owned bind", async () => {
  const calls = [];
  const tabsApi = {};
  function sendMessage(tabId, message) {
    assert.equal(this, tabsApi);
    calls.push({ tabId, message });
    if (tabId === 2) return Promise.reject(new Error("restricted"));
    if (tabId === 3) throw new Error("closed");
    return undefined;
  }
  Object.defineProperty(sendMessage, "bind", {
    configurable: true,
    get() { throw new Error("callback-owned bind must not be read"); }
  });
  tabsApi.sendMessage = sendMessage;

  const message = { type: "drop-ads:test", nested: { value: 1 } };
  const operation = sendTabMessageBatched(
    { tabs: tabsApi },
    [{ id: 1 }, { id: 1 }, { id: 2 }, { id: "bad" }, { id: 3 }],
    message,
    { batchSize: 2 }
  );
  message.nested.value = 99;

  const result = await operation;
  assert.deepEqual(result, { attempted: 3, failed: 2 });
  assert.deepEqual(calls.map((entry) => entry.tabId), [1, 2, 3]);
  assert.ok(calls.every((entry) => entry.message.nested.value === 1));
  assert.equal(MAX_TAB_MESSAGE_CONCURRENCY, 32);
});
