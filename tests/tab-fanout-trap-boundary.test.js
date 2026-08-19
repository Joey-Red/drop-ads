import assert from "node:assert/strict";
import test from "node:test";

import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

function apiWith(sent) {
  return { tabs: { sendMessage: async (tabId, message) => { sent.push([tabId, message]); } } };
}

test("tab fanout options do not use normal property gets", async () => {
  let gets = 0;
  const options = new Proxy({ batchSize: 1 }, {
    get(target, key, receiver) { gets += 1; return Reflect.get(target, key, receiver); }
  });
  const sent = [];
  await sendTabMessageBatched(apiWith(sent), [{ id: 1 }], { type: "x" }, options);
  assert.equal(gets, 0);
  assert.equal(sent.length, 1);
});

test("tab fanout does not read array length normally", async () => {
  let gets = 0;
  const tabs = new Proxy([{ id: 1 }, { id: 2 }], {
    get(target, key, receiver) { gets += 1; return Reflect.get(target, key, receiver); }
  });
  const sent = [];
  await sendTabMessageBatched(apiWith(sent), tabs, { type: "x" });
  assert.equal(gets, 0);
  assert.deepEqual(sent.map(([id]) => id), [1, 2]);
});

test("tab fanout never executes tab id getters", async () => {
  let calls = 0;
  const tab = {};
  Object.defineProperty(tab, "id", { enumerable: true, get() { calls += 1; return 7; } });
  const sent = [];
  await sendTabMessageBatched(apiWith(sent), [tab, { id: 8 }], { type: "x" });
  assert.equal(calls, 0);
  assert.deepEqual(sent.map(([id]) => id), [8]);
});
