import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

test("revoked Proxy byte chunks fail through the reader boundary and trigger cancellation", async () => {
  const target = new Uint8Array([65]);
  const { proxy, revoke } = Proxy.revocable(target, {});
  revoke();
  let cancelled = 0;
  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      return { done: false, value: proxy };
    },
    async cancel() { cancelled += 1; }
  };
  const response = {
    body: { getReader() { return reader; } }
  };

  await assert.rejects(() => readResponseTextBounded(response, 1024), /invalid byte chunk/);
  assert.equal(reads, 1);
  assert.equal(cancelled, 1);
});

test("actual Uint8Array chunks remain accepted", async () => {
  let step = 0;
  const reader = {
    async read() {
      step += 1;
      return step === 1
        ? { done: false, value: new Uint8Array([79, 75]) }
        : { done: true };
    },
    async cancel() {}
  };
  const response = { body: { getReader() { return reader; } } };
  assert.equal(await readResponseTextBounded(response, 1024), "OK");
});
