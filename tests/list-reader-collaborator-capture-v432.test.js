import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

test("M432 synthetic reader operations are captured once with the original receiver", async () => {
  const chunks = [new TextEncoder().encode("abc"), null];
  const reader = {
    read() {
      assert.equal(this, reader);
      reader.read = () => { throw new Error("replacement read must not be used"); };
      const chunk = chunks.shift();
      return Promise.resolve(chunk ? { done: false, value: chunk } : { done: true });
    },
    cancel() {
      assert.equal(this, reader);
      return Promise.resolve();
    }
  };
  const response = { body: { getReader: () => reader }, text: async () => "fallback" };
  assert.equal(await readResponseTextBounded(response), "abc");
});

test("M432 accessor-backed synthetic reader read fails without executing the getter", async () => {
  let getterCalls = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return async () => ({ done: true });
    }
  });
  const response = { body: { getReader: () => reader }, text: async () => "fallback" };
  await assert.rejects(() => readResponseTextBounded(response), /reader read must be an own enumerable data function/i);
  assert.equal(getterCalls, 0);
});

test("M432 cancellation failure never replaces the actionable read failure", async () => {
  const reader = {
    read: async () => { throw new Error("read failure"); },
    cancel: async () => { throw new Error("cancel failure"); }
  };
  const response = { body: { getReader: () => reader }, text: async () => "fallback" };
  await assert.rejects(() => readResponseTextBounded(response), /read failure/);
});
