import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function streamedResponse(reader) {
  return { headers: null, body: { getReader() { return reader; } }, async text() { return "fallback"; } };
}

test("M434 synthetic abort signal collaborators keep receiver semantics", async () => {
  let added = 0;
  let removed = 0;
  const signal = {
    aborted: false,
    addEventListener(type) { assert.equal(this, signal); assert.equal(type, "abort"); added += 1; },
    removeEventListener(type) { assert.equal(this, signal); assert.equal(type, "abort"); removed += 1; }
  };
  const reader = { async read() { return { done: true }; }, async cancel() {} };
  assert.equal(await readResponseTextBounded(streamedResponse(reader), 16, { signal }), "");
  assert.equal(added, 1);
  assert.equal(removed, 1);
});

test("M434 synthetic abort signal accessors are rejected without execution", async () => {
  let getterCalls = 0;
  const signal = {};
  Object.defineProperty(signal, "aborted", { enumerable: true, get() { getterCalls += 1; return false; } });
  await assert.rejects(
    readResponseTextBounded(streamedResponse({ async read() { return { done: true }; } }), 16, { signal }),
    /abort signal aborted must be an own enumerable boolean data field/
  );
  assert.equal(getterCalls, 0);
});

test("M434 malformed mutated synthetic aborted state fails closed", async () => {
  const signal = { aborted: false };
  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads === 1) {
        signal.aborted = "no";
        return { done: false, value: new Uint8Array([97]) };
      }
      return { done: true };
    },
    async cancel() {}
  };
  await assert.rejects(readResponseTextBounded(streamedResponse(reader), 16, { signal }), /timed out/);
});
