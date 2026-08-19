import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function emptyStreamResponse() {
  return {
    body: {
      getReader() {
        return {
          async read() { return { done: true }; },
          async cancel() {}
        };
      }
    },
    text() { return ""; }
  };
}

test("M434 synthetic abort listener operations are captured before streaming", async () => {
  let removes = 0;
  const signal = {
    aborted: false,
    addEventListener() {
      signal.addEventListener = () => { throw new Error("mutated add must not run"); };
      signal.removeEventListener = () => { throw new Error("mutated remove must not run"); };
    },
    removeEventListener() { removes += 1; }
  };

  assert.equal(await readResponseTextBounded(emptyStreamResponse(), 32, { signal, headersGet: () => null }), "");
  assert.equal(removes, 1);
});

test("M434 synthetic abort-state accessors fail closed without getter execution", async () => {
  let getterCalls = 0;
  const signal = {
    addEventListener() {},
    removeEventListener() {}
  };
  Object.defineProperty(signal, "aborted", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return false;
    }
  });

  await assert.rejects(
    readResponseTextBounded(emptyStreamResponse(), 32, { signal, headersGet: () => null }),
    /abort signal aborted.*own enumerable boolean data field/i
  );
  assert.equal(getterCalls, 0);
});
