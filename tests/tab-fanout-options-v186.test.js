import assert from "node:assert/strict";
import test from "node:test";

import { MAX_TAB_MESSAGE_CONCURRENCY, sendTabMessageBatched } from "../src/core/tab-fanout.js";

function apiSpy() {
  const sent = [];
  return {
    sent,
    api: {
      tabs: {
        async sendMessage(tabId, message) {
          sent.push([tabId, message]);
        }
      }
    }
  };
}

test("tab fanout rejects option accessors without invoking getters or sending", async () => {
  const { api, sent } = apiSpy();
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "batchSize", {
    enumerable: true,
    get() {
      reads += 1;
      return 1;
    }
  });
  await assert.rejects(sendTabMessageBatched(api, [{ id: 1 }], { type: "x" }, options), /data field/);
  assert.equal(reads, 0);
  assert.equal(sent.length, 0);
});

test("tab fanout options reject unknown fields and custom prototypes", async () => {
  const { api, sent } = apiSpy();
  await assert.rejects(sendTabMessageBatched(api, [{ id: 1 }], { type: "x" }, { batchSize: 1, history: true }), /unsupported field/);
  await assert.rejects(sendTabMessageBatched(api, [{ id: 1 }], { type: "x" }, Object.create({ batchSize: 1 })), /plain object/);
  assert.equal(sent.length, 0);
});

test("tab fanout batch size stays within the reviewed 32-concurrency ceiling", async () => {
  const { api } = apiSpy();
  await assert.rejects(sendTabMessageBatched(api, [], { type: "x" }, { batchSize: 0 }), /between 1 and/);
  await assert.rejects(sendTabMessageBatched(api, [], { type: "x" }, { batchSize: MAX_TAB_MESSAGE_CONCURRENCY + 1 }), /between 1 and/);
  await assert.rejects(sendTabMessageBatched(api, [], { type: "x" }, { batchSize: "1" }), /between 1 and/);
});

test("tab fanout default options preserve dedupe and best-effort sending", async () => {
  const { api, sent } = apiSpy();
  const result = await sendTabMessageBatched(api, [{ id: 2 }, { id: 2 }, { id: 3 }], { type: "x" });
  assert.deepEqual(result, { attempted: 2, failed: 0 });
  assert.deepEqual(sent.map(([id]) => id), [2, 3]);
});
