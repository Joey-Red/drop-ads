import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function streamingResponse(text = "ok") {
  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      return reads === 1
        ? { done: false, value: new TextEncoder().encode(text) }
        : { done: true };
    },
    async cancel() {}
  };
  return {
    body: { getReader() { return reader; } }
  };
}

test("M439 synthetic abort listener collaborators are captured before body work", async () => {
  const calls = [];
  const signal = {
    aborted: false,
    addEventListener(type, listener, options) {
      calls.push(["add", this === signal, type, options?.once === true]);
      signal.removeEventListener = () => { throw new Error("later remover mutation must not be observed"); };
    },
    removeEventListener(type) {
      calls.push(["remove", this === signal, type]);
    }
  };

  assert.equal(await readResponseTextBounded(streamingResponse(), undefined, { signal }), "ok");
  assert.deepEqual(calls, [
    ["add", true, "abort", true],
    ["remove", true, "abort"]
  ]);
});

test("M439 synthetic abort accessors fail closed without getter execution", async () => {
  let getterRuns = 0;
  const signal = {
    addEventListener() {},
    removeEventListener() {}
  };
  Object.defineProperty(signal, "aborted", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return false;
    }
  });

  await assert.rejects(
    readResponseTextBounded(streamingResponse(), undefined, { signal }),
    /aborted must be an own enumerable boolean data field/
  );
  assert.equal(getterRuns, 0);
});
