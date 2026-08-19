import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseWithReader(reader) {
  return {
    body: {
      getReader() { return reader; }
    }
  };
}

test("M446 rejects synthetic reader accessors before body iteration", async () => {
  let getterCalls = 0;
  let cancelCalls = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return async () => ({ done: true });
    }
  });
  reader.cancel = async () => { cancelCalls += 1; };

  await assert.rejects(() => readResponseTextBounded(responseWithReader(reader)), /reader read.*own enumerable data function/i);
  assert.equal(getterCalls, 0);
  assert.equal(cancelCalls, 0);
});

test("M446 captured reader methods preserve receiver and ignore callback-owned bind", async () => {
  const bytes = new TextEncoder().encode("example.com\n");
  let reads = 0;
  let receiver = null;
  function read() {
    receiver = this;
    reads += 1;
    return Promise.resolve(reads === 1 ? { done: false, value: bytes } : { done: true });
  }
  Object.defineProperty(read, "bind", {
    configurable: true,
    get() { throw new Error("callback bind must not be read"); }
  });
  const reader = { read, cancel() {} };

  assert.equal(await readResponseTextBounded(responseWithReader(reader)), "example.com\n");
  assert.equal(receiver, reader);
  assert.equal(reads, 2);
});

test("M446 oversize cancellation uses the captured cancel operation", async () => {
  let cancelReceiver = null;
  let cancelCalls = 0;
  const reader = {
    read() { return Promise.resolve({ done: false, value: new Uint8Array(4) }); },
    cancel() {
      cancelReceiver = this;
      cancelCalls += 1;
      return Promise.resolve();
    }
  };
  const capturedCancel = reader.cancel;
  const promise = readResponseTextBounded(responseWithReader(reader), 1);
  reader.cancel = () => { throw new Error("mutated cancel must not run"); };

  await assert.rejects(() => promise, /too large/i);
  assert.equal(cancelCalls, 1);
  assert.equal(cancelReceiver, reader);
  assert.notEqual(reader.cancel, capturedCancel);
});
