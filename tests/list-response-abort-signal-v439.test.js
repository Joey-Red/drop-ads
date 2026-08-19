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

test("M439 response streaming captures synthetic abort listener collaborators once", async () => {
  let removed = 0;
  let removeGetterReads = 0;
  const signal = {
    aborted: false,
    addEventListener() {
      Object.defineProperty(signal, "removeEventListener", {
        configurable: true,
        get() {
          removeGetterReads += 1;
          throw new Error("late remove listener getter must not run");
        }
      });
    },
    removeEventListener() { removed += 1; }
  };

  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads === 1) return { done: false, value: new TextEncoder().encode("example.com\n") };
      return { done: true };
    },
    async cancel() {}
  };

  const text = await readResponseTextBounded(responseWithReader(reader), 1024, {
    signal,
    headersGet: () => null
  });

  assert.equal(text, "example.com\n");
  assert.equal(removed, 1);
  assert.equal(removeGetterReads, 0);
});

test("M439 malformed synthetic abort state fails before reader body work", async () => {
  let reads = 0;
  const reader = {
    async read() { reads += 1; return { done: true }; },
    async cancel() {}
  };
  const signal = { aborted: "false", addEventListener() {}, removeEventListener() {} };

  await assert.rejects(
    readResponseTextBounded(responseWithReader(reader), 1024, { signal, headersGet: () => null }),
    /aborted must be an own enumerable boolean data field/
  );
  assert.equal(reads, 0);
});
