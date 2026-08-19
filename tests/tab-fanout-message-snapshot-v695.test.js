import test from "node:test";
import assert from "node:assert/strict";
import { MAX_TAB_FANOUT_MESSAGE_TEXT_CHARS, sendTabMessageBatched } from "../src/core/tab-fanout.js";

test("tab fanout message capture does not invoke accessors", async () => {
  let getterReads = 0;
  let sends = 0;
  const api = { tabs: { async sendMessage() { sends += 1; } } };
  const message = { type: "refresh" };
  Object.defineProperty(message, "secret", {
    enumerable: true,
    get() { getterReads += 1; return "should-not-run"; }
  });

  await assert.rejects(sendTabMessageBatched(api, [{ id: 1 }], message), /enumerable data field/);
  assert.equal(getterReads, 0);
  assert.equal(sends, 0);
});

test("tab fanout captures nested message data before caller mutation", async () => {
  const seen = [];
  const api = { tabs: { async sendMessage(_tabId, message) { seen.push(message); } } };
  const message = { type: "refresh", detail: { value: "original" }, ids: [1, 2] };
  const pending = sendTabMessageBatched(api, [{ id: 1 }, { id: 2 }], message);
  message.detail.value = "mutated";
  message.ids[0] = 99;
  await pending;

  assert.equal(seen.length, 2);
  assert.equal(seen[0].detail.value, "original");
  assert.deepEqual([...seen[0].ids], [1, 2]);
  assert.equal(Object.isFrozen(seen[0]), true);
  assert.equal(Object.isFrozen(seen[0].detail), true);
  assert.equal(Object.isFrozen(seen[0].ids), true);
});

test("tab fanout rejects revoked proxies and over-budget text before sends", async () => {
  let sends = 0;
  const api = { tabs: { async sendMessage() { sends += 1; } } };
  const { proxy, revoke } = Proxy.revocable({ type: "refresh" }, {});
  revoke();
  await assert.rejects(sendTabMessageBatched(api, [{ id: 1 }], proxy), /safely inspectable/);
  await assert.rejects(
    sendTabMessageBatched(api, [{ id: 1 }], { type: "x".repeat(MAX_TAB_FANOUT_MESSAGE_TEXT_CHARS + 1) }),
    /message text exceeds/
  );
  assert.equal(sends, 0);
});
