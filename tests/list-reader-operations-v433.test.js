import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseWithReader(reader) {
  return {
    body: {
      getReader() { return reader; }
    },
    text() { throw new Error("text fallback must not run"); }
  };
}

test("M433 reader operations are captured once before streaming", async () => {
  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads === 1) {
        reader.read = () => { throw new Error("mutated read must not be observed"); };
        return { done: false, value: new TextEncoder().encode("abc") };
      }
      return { done: true };
    },
    async cancel() {}
  };

  const text = await readResponseTextBounded(responseWithReader(reader), 32, { headersGet: () => null });
  assert.equal(text, "abc");
  assert.equal(reads, 2);
});

test("M433 synthetic reader accessors fail closed without getter execution", async () => {
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
    /reader read.*own enumerable data function|reader read.*unavailable/i
  );
  assert.equal(getterCalls, 0);
});
