import test from "node:test";
import assert from "node:assert/strict";
import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("tab fanout invokes captured sender without callback-owned bind", async () => {
  let bindReads = 0;
  const sent = [];
  function sendMessage(tabId, message) {
    sent.push([this, tabId, message]);
    return Promise.resolve();
  }
  Object.defineProperty(sendMessage, "bind", {
    configurable: true,
    get() {
      bindReads += 1;
      throw new Error("callback-owned bind must not be read");
    }
  });
  const tabsApi = { sendMessage };
  const result = await sendTabMessageBatched(
    { tabs: tabsApi },
    [{ id: 3 }, { id: 3 }, { id: 7 }],
    { type: "refresh" },
    { batchSize: 1 }
  );

  assert.equal(bindReads, 0);
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.deepEqual(sent.map((entry) => entry[1]), [3, 7]);
  assert.equal(sent.every((entry) => entry[0] === tabsApi), true);
});

test("tab fanout rejects accessor-shaped sendMessage without executing it", async () => {
  let getterReads = 0;
  const tabsApi = {};
  Object.defineProperty(tabsApi, "sendMessage", {
    enumerable: true,
    get() {
      getterReads += 1;
      throw new Error("getter must not run");
    }
  });

  await assert.rejects(
    sendTabMessageBatched({ tabs: tabsApi }, [{ id: 1 }], { type: "refresh" }),
    /data function/
  );
  assert.equal(getterReads, 0);
});
