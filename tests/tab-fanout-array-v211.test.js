import assert from "node:assert/strict";
import test from "node:test";

import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

function apiHarness() {
  const sent = [];
  return {
    api: { tabs: { async sendMessage(tabId, message) { sent.push([tabId, message]); } } },
    sent
  };
}

test("tab fanout rejects sparse/accessor/extra-property arrays before sends", async () => {
  const h = apiHarness();
  const sparse = new Array(1);
  await assert.rejects(() => sendTabMessageBatched(h.api, sparse, { type: "x" }), /enumerable data entries/);

  let reads = 0;
  const accessor = [{ id: 1 }];
  Object.defineProperty(accessor, "0", {
    enumerable: true,
    get() {
      reads += 1;
      return { id: 1 };
    }
  });
  await assert.rejects(() => sendTabMessageBatched(h.api, accessor, { type: "x" }), /enumerable data entries/);
  assert.equal(reads, 0);

  const extra = [{ id: 1 }];
  extra.note = true;
  await assert.rejects(() => sendTabMessageBatched(h.api, extra, { type: "x" }), /enumerable data entries/);
  assert.deepEqual(h.sent, []);
});

test("tab fanout snapshots, filters, and dedupes ids without total truncation", async () => {
  const h = apiHarness();
  const tabs = [{ id: 1 }, { id: 1 }, { id: -1 }, { id: 2 }, {}, { id: 3 }];
  const result = await sendTabMessageBatched(h.api, tabs, { type: "x" }, { batchSize: 2 });
  assert.deepEqual(result, { attempted: 3, failed: 0 });
  assert.deepEqual(h.sent.map(([id]) => id), [1, 2, 3]);
});
