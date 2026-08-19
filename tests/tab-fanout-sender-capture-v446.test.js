import test from "node:test";
import assert from "node:assert/strict";
import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("M446 tab fanout preserves the tabs receiver without consulting callback-owned bind", async () => {
  const tabsApi = { calls: [] };
  function sendMessage(tabId, message) {
    assert.equal(this, tabsApi);
    this.calls.push([tabId, message]);
  }
  Object.defineProperty(sendMessage, "bind", { get() { throw new Error("bind must not be read"); } });
  tabsApi.sendMessage = sendMessage;

  const result = await sendTabMessageBatched({ tabs: tabsApi }, [{ id: 7 }, { id: 7 }, { id: 8 }], { type: "refresh" }, { batchSize: 1 });
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.deepEqual(tabsApi.calls.map(([id]) => id), [7, 8]);
});
