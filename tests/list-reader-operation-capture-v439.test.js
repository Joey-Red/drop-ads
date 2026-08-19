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

test("M439 streamed reader operations are captured once with their receiver", async () => {
  let reads = 0;
  let cancels = 0;
  const reader = {
    async read() {
      assert.equal(this, reader);
      reads += 1;
      if (reads === 1) {
        reader.read = () => { throw new Error("later read mutation must not be observed"); };
        reader.cancel = () => { throw new Error("later cancel mutation must not be observed"); };
        return { done: false, value: new TextEncoder().encode("ok") };
      }
      return { done: true };
    },
    async cancel() {
      assert.equal(this, reader);
      cancels += 1;
    }
  };

  assert.equal(await readResponseTextBounded(syntheticResponse(reader)), "ok");
  assert.equal(reads, 2);
  assert.equal(cancels, 0);
});

test("M439 synthetic reader accessor methods fail closed before read work", async () => {
  let getterRuns = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return async () => ({ done: true });
    }
  });

  await assert.rejects(
    readResponseTextBounded(syntheticResponse(reader)),
    /reader read must be an own enumerable data function/
  );
  assert.equal(getterRuns, 0);
});
