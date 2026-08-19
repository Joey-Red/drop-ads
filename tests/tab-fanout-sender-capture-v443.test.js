import test from "node:test";
import assert from "node:assert/strict";

import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("tab fanout captures tabs namespace and sendMessage before asynchronous sends", async () => {
  let originalCalls = 0;
  let replacementCalls = 0;
  const tabsApi = {
    sendMessage(tabId, message) {
      originalCalls += 1;
      assert.equal(this, tabsApi);
      assert.equal(message.type, "drop-ads:test");
      return Promise.resolve(tabId);
    }
  };
  const api = { tabs: tabsApi };

  const operation = sendTabMessageBatched(api, [{ id: 1 }, { id: 2 }], { type: "drop-ads:test" });
  api.tabs = { sendMessage() { replacementCalls += 1; } };
  tabsApi.sendMessage = () => { replacementCalls += 1; };

  const result = await operation;
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.equal(originalCalls, 2);
  assert.equal(replacementCalls, 0);
});

test("tab namespace and sendMessage accessors are rejected without getter execution", async () => {
  let tabsGetterCalls = 0;
  const accessorApi = {};
  Object.defineProperty(accessorApi, "tabs", {
    get() {
      tabsGetterCalls += 1;
      return { sendMessage() {} };
    }
  });
  await assert.rejects(
    sendTabMessageBatched(accessorApi, [], { type: "drop-ads:test" }),
    /tabs API must be a data property/
  );
  assert.equal(tabsGetterCalls, 0);

  let methodGetterCalls = 0;
  const tabsApi = {};
  Object.defineProperty(tabsApi, "sendMessage", {
    get() {
      methodGetterCalls += 1;
      return () => {};
    }
  });
  await assert.rejects(
    sendTabMessageBatched({ tabs: tabsApi }, [], { type: "drop-ads:test" }),
    /tabs\.sendMessage must be a data function/
  );
  assert.equal(methodGetterCalls, 0);
});

test("captured sendMessage does not consult caller-controlled bind", async () => {
  let calls = 0;
  function sendMessage() {
    calls += 1;
    return Promise.resolve();
  }
  Object.defineProperty(sendMessage, "bind", {
    get() {
      throw new Error("bind must not be read");
    }
  });
  const result = await sendTabMessageBatched(
    { tabs: { sendMessage } },
    [{ id: 7 }],
    { type: "drop-ads:test" }
  );
  assert.deepEqual(result, { attempted: 1, failed: 0 });
  assert.equal(calls, 1);
});
