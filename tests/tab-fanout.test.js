import test from "node:test";
import assert from "node:assert/strict";
import { MAX_TAB_MESSAGE_CONCURRENCY, MAX_TAB_MESSAGE_TARGETS, sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("tab fanout dedupes valid ids and returns an immutable result snapshot", async () => {
  const seen = [];
  const api = { tabs: { async sendMessage(tabId, message) { seen.push({ tabId, message }); } } };
  const result = await sendTabMessageBatched(api, [{ id: 4 }, { id: 4 }, { id: -1 }, { id: "5" }, {}, { id: 6 }], { type: "refresh" });
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => { result.failed = 9; }, TypeError);
  assert.deepEqual(seen.map((item) => item.tabId), [4, 6]);
});

test("fanout bounds concurrent sends without skipping later batches", async () => {
  let active = 0;
  let maxActive = 0;
  const releases = [];
  const api = {
    tabs: {
      async sendMessage() {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => releases.push(resolve));
        active -= 1;
      }
    }
  };
  const tabs = Array.from({ length: MAX_TAB_MESSAGE_CONCURRENCY + 9 }, (_, index) => ({ id: index + 1 }));
  const pending = sendTabMessageBatched(api, tabs, { type: "refresh" });
  await Promise.resolve();
  assert.equal(active, MAX_TAB_MESSAGE_CONCURRENCY);
  assert.equal(maxActive, MAX_TAB_MESSAGE_CONCURRENCY);
  while (releases.length) releases.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  while (releases.length) releases.shift()();
  const result = await pending;
  assert.deepEqual(result, { attempted: tabs.length, failed: 0 });
  assert.equal(maxActive, MAX_TAB_MESSAGE_CONCURRENCY);
});

test("rejected tabs are counted ephemerally and do not stop later sends", async () => {
  const attempted = [];
  const api = {
    tabs: {
      async sendMessage(tabId) {
        attempted.push(tabId);
        if (tabId === 2 || tabId === 34) throw new Error("restricted tab");
      }
    }
  };
  const tabs = Array.from({ length: 40 }, (_, index) => ({ id: index + 1 }));
  const result = await sendTabMessageBatched(api, tabs, { type: "refresh" });
  assert.deepEqual(result, { attempted: 40, failed: 2 });
  assert.deepEqual(attempted, Array.from({ length: 40 }, (_, index) => index + 1));
});

test("empty fanout performs no messaging and invalid batch sizes fail", async () => {
  let calls = 0;
  const api = { tabs: { async sendMessage() { calls += 1; } } };
  const empty = await sendTabMessageBatched(api, [], { type: "refresh" });
  assert.deepEqual(empty, { attempted: 0, failed: 0 });
  assert.equal(Object.isFrozen(empty), true);
  assert.equal(calls, 0);
  await assert.rejects(sendTabMessageBatched(api, [{ id: 1 }], {}, { batchSize: MAX_TAB_MESSAGE_CONCURRENCY + 1 }), /batch size/);
});

test("fanout rejects target collections beyond the explicit work ceiling before sends", async () => {
  let calls = 0;
  const api = { tabs: { async sendMessage() { calls += 1; } } };
  const tabs = Array.from({ length: MAX_TAB_MESSAGE_TARGETS + 1 }, (_, index) => ({ id: index + 1 }));
  await assert.rejects(sendTabMessageBatched(api, tabs, { type: "refresh" }), /Tab fanout tabs/);
  assert.equal(calls, 0);
});
