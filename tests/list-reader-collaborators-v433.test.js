import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseWithReader(reader) {
  return {
    headers: null,
    body: { getReader() { return reader; } },
    async text() { throw new Error("stream path should win"); }
  };
}

test("M433 synthetic reader operations are captured with receiver semantics", async () => {
  let reads = 0;
  const reader = {
    async read() {
      assert.equal(this, reader);
      reads += 1;
      return reads === 1
        ? { done: false, value: new TextEncoder().encode("ok") }
        : { done: true };
    },
    async cancel() {
      assert.equal(this, reader);
    }
  };
  assert.equal(await readResponseTextBounded(responseWithReader(reader), 16), "ok");
  assert.equal(reads, 2);
});

test("M433 reader accessors are rejected without execution", async () => {
  let getterCalls = 0;
  const reader = { cancel() {} };
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return async () => ({ done: true });
    }
  });
  await assert.rejects(readResponseTextBounded(responseWithReader(reader), 16), /reader read must be an own enumerable data function/);
  assert.equal(getterCalls, 0);
});

test("M433 cancellation failure never replaces the body admission error", async () => {
  const reader = {
    async read() { return { done: false, value: "not bytes" }; },
    async cancel() { throw new Error("cancel failure"); }
  };
  await assert.rejects(readResponseTextBounded(responseWithReader(reader), 16), /invalid byte chunk/);
});
