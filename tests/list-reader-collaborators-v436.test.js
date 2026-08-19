import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

const encoder = new TextEncoder();

function streamedResponse(reader) {
  return {
    body: {
      getReader() { return reader; }
    }
  };
}

test("M436 reader read operation is captured once with its original receiver", async () => {
  let index = 0;
  const reader = {
    async read() {
      assert.equal(this, reader);
      if (index === 0) {
        index += 1;
        reader.read = async () => { throw new Error("mutated reader.read must not be used"); };
        return { done: false, value: encoder.encode("block domain ads.example\n") };
      }
      return { done: true, value: undefined };
    },
    async cancel() {}
  };

  const text = await readResponseTextBounded(streamedResponse(reader), 1024, { headersGet: () => null });
  assert.equal(text, "block domain ads.example\n");
  assert.equal(index, 1);
});

test("M436 synthetic reader accessors are rejected without executing them", async () => {
  let getterCalls = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterCalls += 1;
      throw new Error("reader getter must not execute");
    }
  });

  await assert.rejects(
    readResponseTextBounded(streamedResponse(reader), 1024, { headersGet: () => null }),
    /reader read/i
  );
  assert.equal(getterCalls, 0);
});

test("M436 cancellation uses the captured cancel operation and keeps cancellation best effort", async () => {
  let cancelCalls = 0;
  const reader = {
    async read() {
      reader.cancel = async () => { throw new Error("mutated cancel must not be used"); };
      return { done: false, value: new Uint8Array(5) };
    },
    async cancel() {
      assert.equal(this, reader);
      cancelCalls += 1;
      throw new Error("best-effort cancel failure");
    }
  };

  await assert.rejects(
    readResponseTextBounded(streamedResponse(reader), 4, { headersGet: () => null }),
    /too large/i
  );
  assert.equal(cancelCalls, 1);
});
