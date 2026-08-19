import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseFromResults(results) {
  let index = 0;
  const reader = {
    async read() { return results[index++]; },
    async cancel() {}
  };
  return {
    body: { getReader() { return reader; } },
    async text() { return ""; }
  };
}

test("synthetic abort signal accessors are rejected without getter execution", async () => {
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
    readResponseTextBounded(responseFromResults([{ done: true }]), 32, { signal, headersGet: () => null }),
    /aborted must be an own enumerable boolean data field/
  );
  assert.equal(getterCalls, 0);
});

test("throwing abort-listener removal cannot replace a successful body read", async () => {
  const signal = {
    aborted: false,
    addEventListener() {},
    removeEventListener() { throw new Error("cleanup must be isolated"); }
  };
  const response = responseFromResults([
    { done: false, value: new Uint8Array([65]) },
    { done: true }
  ]);

  assert.equal(await readResponseTextBounded(response, 32, { signal, headersGet: () => null }), "A");
});

test("captured synthetic signal listener methods keep their original receiver", async () => {
  const calls = [];
  const signal = {
    aborted: false,
    addEventListener(type) { assert.equal(this, signal); calls.push(`add:${type}`); },
    removeEventListener(type) { assert.equal(this, signal); calls.push(`remove:${type}`); }
  };
  const response = responseFromResults([{ done: true }]);

  assert.equal(await readResponseTextBounded(response, 32, { signal, headersGet: () => null }), "");
  assert.deepEqual(calls, ["add:abort", "remove:abort"]);
});
