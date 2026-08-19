import test from "node:test";
import assert from "node:assert/strict";
import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("M444 tab fanout invokes captured sendMessage with its original receiver without callback bind", async () => {
  const calls = [];
  const tabsApi = { marker: "tabs-receiver" };
  function sendMessage(tabId, message) {
    assert.equal(this, tabsApi);
    calls.push([tabId, message.type]);
    return Promise.resolve();
  }
  Object.defineProperty(sendMessage, "bind", {
    configurable: true,
    get() { throw new Error("callback-owned bind must not be read"); }
  });
  Object.defineProperty(tabsApi, "sendMessage", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: sendMessage
  });
  const api = { tabs: tabsApi };

  const result = await sendTabMessageBatched(api, [{ id: 7 }, { id: 7 }, { id: 9 }], { type: "drop-ads:refresh-cosmetics" }, { batchSize: 1 });
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.deepEqual(calls, [[7, "drop-ads:refresh-cosmetics"], [9, "drop-ads:refresh-cosmetics"]]);
});

test("M444 one synchronous sender failure remains isolated from later tabs", async () => {
  const attempted = [];
  const tabsApi = {
    sendMessage(tabId) {
      attempted.push(tabId);
      if (tabId === 2) throw new Error("restricted tab");
      return Promise.resolve();
    }
  };
  const result = await sendTabMessageBatched({ tabs: tabsApi }, [{ id: 1 }, { id: 2 }, { id: 3 }], { type: "x" }, { batchSize: 2 });
  assert.deepEqual(result, { attempted: 3, failed: 1 });
  assert.deepEqual(attempted, [1, 2, 3]);
});
