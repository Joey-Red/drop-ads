import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function syntheticResponse(reader) {
  return {
    body: {
      getReader() { return reader; }
    }
  };
}

test("stream reader read/cancel operations are captured before the loop", async () => {
  let reads = 0;
  let cancels = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads === 1) {
        this.read = () => { throw new Error("mutated read must not run"); };
        this.cancel = () => { throw new Error("mutated cancel must not run"); };
        return { done: false, value: new TextEncoder().encode("ok") };
      }
      return { done: true };
    },
    async cancel() { cancels += 1; }
  };

  const text = await readResponseTextBounded(syntheticResponse(reader), 64, { headersGet: () => null });
  assert.equal(text, "ok");
  assert.equal(reads, 2);
  assert.equal(cancels, 0);
});

test("synthetic reader accessor methods fail before getter execution", async () => {
  let getterCalls = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return async () => ({ done: true });
    }
  });

  await assert.rejects(
    readResponseTextBounded(syntheticResponse(reader), 64, { headersGet: () => null }),
    /reader read/i
  );
  assert.equal(getterCalls, 0);
});

test("reader cancellation failure never replaces the actionable read error", async () => {
  const reader = {
    async read() { return { done: false, value: "not-bytes" }; },
    async cancel() { throw new Error("cancel failure"); }
  };

  await assert.rejects(
    readResponseTextBounded(syntheticResponse(reader), 64, { headersGet: () => null }),
    /invalid byte chunk/
  );
});
