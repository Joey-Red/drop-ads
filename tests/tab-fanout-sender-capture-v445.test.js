import test from "node:test";
import assert from "node:assert/strict";

import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("M445 tab fanout does not invoke a callback-owned bind property", async () => {
  const calls = [];
  function sendMessage(tabId, message) {
    assert.equal(this, tabsApi);
    calls.push([tabId, message.type]);
  }
  Object.defineProperty(sendMessage, "bind", {
    configurable: true,
    get() { throw new Error("callback-owned bind must not be read"); }
  });
  const tabsApi = { sendMessage };
  const result = await sendTabMessageBatched(
    { tabs: tabsApi },
    [{ id: 7 }],
    { type: "drop-ads:cosmetic-refresh" }
  );
  assert.deepEqual(result, { attempted: 1, failed: 0 });
  assert.deepEqual(calls, [[7, "drop-ads:cosmetic-refresh"]]);
});

test("M445 accessor-shaped tab sender is rejected without executing the getter", async () => {
  let getterCalls = 0;
  const tabsApi = {};
  Object.defineProperty(tabsApi, "sendMessage", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return () => undefined;
    }
  });
  await assert.rejects(
    sendTabMessageBatched({ tabs: tabsApi }, [{ id: 1 }], { type: "x" }),
    /data function/
  );
  assert.equal(getterCalls, 0);
});

test("M445 prototype data sender retains its original receiver", async () => {
  class TabsApi {
    constructor() { this.calls = []; }
    sendMessage(tabId) { this.calls.push(tabId); }
  }
  const tabsApi = new TabsApi();
  const result = await sendTabMessageBatched({ tabs: tabsApi }, [{ id: 2 }, { id: 2 }, { id: 3 }], { type: "x" });
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.deepEqual(tabsApi.calls, [2, 3]);
});
