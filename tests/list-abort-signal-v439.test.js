import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseForReader(reader) {
  return {
    body: { getReader: () => reader },
    text: async () => { throw new Error("text fallback must not run"); }
  };
}

test("M439 synthetic signal accessors fail before reader work without executing getters", async () => {
  let getterCalls = 0;
  let readCalls = 0;
  const signal = {};
  Object.defineProperty(signal, "aborted", {
    enumerable: true,
    get() { getterCalls += 1; return false; }
  });
  signal.addEventListener = () => {};
  signal.removeEventListener = () => {};

  await assert.rejects(readResponseTextBounded(
    responseForReader({ read: async () => { readCalls += 1; return { done: true }; }, cancel: async () => {} }),
    100,
    { signal }
  ));
  assert.equal(getterCalls, 0);
  assert.equal(readCalls, 0);
});

test("M439 synthetic signal listener methods are captured and removal failure is best effort", async () => {
  let added = 0;
  let removed = 0;
  const signal = {
    aborted: false,
    addEventListener() { added += 1; },
    removeEventListener() { removed += 1; throw new Error("cleanup failed"); }
  };
  const reader = {
    async read() { return { done: false, value: new Uint8Array([97]) }; },
    async cancel() {}
  };
  let calls = 0;
  reader.read = async () => (++calls === 1
    ? { done: false, value: new Uint8Array([97]) }
    : { done: true });

  assert.equal(await readResponseTextBounded(responseForReader(reader), 100, { signal }), "a");
  assert.equal(added, 1);
  assert.equal(removed, 1);
});
