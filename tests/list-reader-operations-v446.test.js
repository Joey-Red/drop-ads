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

test("M446 captured reader operations preserve receiver identity without callback-owned bind", async () => {
  let index = 0;
  let cancelCalls = 0;
  const reader = {};
  function read() {
    assert.equal(this, reader);
    index += 1;
    return index === 1
      ? { done: false, value: new TextEncoder().encode("ok") }
      : { done: true };
  }
  function cancel() {
    assert.equal(this, reader);
    cancelCalls += 1;
  }
  Object.defineProperty(read, "bind", { get() { throw new Error("read.bind must not be read"); } });
  Object.defineProperty(cancel, "bind", { get() { throw new Error("cancel.bind must not be read"); } });
  reader.read = read;
  reader.cancel = cancel;

  const text = await readResponseTextBounded(responseWithReader(reader), 32, { headersGet: () => null });
  assert.equal(text, "ok");
  assert.equal(cancelCalls, 0);
});

test("M446 accessor-shaped synthetic reader read is rejected without getter execution", async () => {
  let getterCalls = 0;
  const reader = { cancel() {} };
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return async () => ({ done: true });
    }
  });

  await assert.rejects(
    readResponseTextBounded(responseWithReader(reader), 32, { headersGet: () => null }),
    /read must be an own enumerable data function when present/
  );
  assert.equal(getterCalls, 0);
});

test("M446 oversize streamed input cancels through the captured cancel operation", async () => {
  let cancelCalls = 0;
  const reader = {
    async read() { return { done: false, value: new Uint8Array([1, 2, 3, 4]) }; },
    async cancel() { cancelCalls += 1; }
  };

  await assert.rejects(
    readResponseTextBounded(responseWithReader(reader), 3, { headersGet: () => null }),
    /Remote list is too large/
  );
  assert.equal(cancelCalls, 1);
});
