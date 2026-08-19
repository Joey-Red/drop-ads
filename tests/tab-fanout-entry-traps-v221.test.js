import assert from "node:assert/strict";
import test from "node:test";

import { sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("tab fanout skips throwing and custom-prototype entries while continuing", async () => {
  const sent = [];
  const api = { tabs: { async sendMessage(id) { sent.push(id); } } };
  const descriptorTrap = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("boom"); } });
  const prototypeTrap = new Proxy({}, { getPrototypeOf() { throw new Error("boom"); } });
  const custom = Object.assign(Object.create({ custom: true }), { id: 2 });
  const normal = { id: 3 };
  const nullProto = Object.assign(Object.create(null), { id: 4 });
  const result = await sendTabMessageBatched(api, [descriptorTrap, prototypeTrap, custom, normal, nullProto], { type: "refresh" });
  assert.deepEqual(sent, [3, 4]);
  assert.deepEqual(result, { attempted: 2, failed: 0 });
});

test("tab fanout still dedupes valid ids after invalid entries", async () => {
  const sent = [];
  const api = { tabs: { async sendMessage(id) { sent.push(id); } } };
  const result = await sendTabMessageBatched(api, [{ id: 7 }, { id: 7 }, { id: -1 }, { id: 8 }], { type: "refresh" });
  assert.deepEqual(sent, [7, 8]);
  assert.deepEqual(result, { attempted: 2, failed: 0 });
});
