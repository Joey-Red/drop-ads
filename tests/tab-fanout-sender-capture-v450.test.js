import test from "node:test";
import assert from "node:assert/strict";

import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("M450 later tabs.sendMessage mutation cannot redirect later batches", async () => {
  const calls = [];
  const tabsApi = {
    async sendMessage(tabId, message) {
      calls.push(["captured", tabId, message.type]);
      if (tabId === 1) {
        tabsApi.sendMessage = async (laterId) => { calls.push(["mutated", laterId]); };
      }
    }
  };
  const api = { tabs: tabsApi };

  const result = await sendTabMessageBatched(
    api,
    [{ id: 1 }, { id: 2 }],
    { type: "drop-ads:cosmetic-refresh" },
    { batchSize: 1 }
  );

  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.deepEqual(calls, [
    ["captured", 1, "drop-ads:cosmetic-refresh"],
    ["captured", 2, "drop-ads:cosmetic-refresh"]
  ]);
});

test("M450 accessor-shaped api.tabs is rejected without executing the getter", async () => {
  let getterCalls = 0;
  const api = {};
  Object.defineProperty(api, "tabs", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return { sendMessage() {} };
    }
  });

  await assert.rejects(
    sendTabMessageBatched(api, [], { type: "x" }),
    /Tab fanout tabs API must be a data property/
  );
  assert.equal(getterCalls, 0);
});
