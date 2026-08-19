import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function streamedResponse(chunks, onCancel = () => {}) {
  let index = 0;
  const reader = {
    async read() {
      if (index >= chunks.length) return { done: true };
      return { done: false, value: chunks[index++] };
    },
    async cancel() { onCancel(); }
  };
  return {
    body: { getReader() { return reader; } }
  };
}

test("M452 streamed accounting ignores a shadowing byteLength getter", async () => {
  let getterCalls = 0;
  const chunk = new Uint8Array([0x61, 0x62, 0x63]);
  Object.defineProperty(chunk, "byteLength", {
    configurable: true,
    get() { getterCalls += 1; throw new Error("shadow getter must not run"); }
  });

  const text = await readResponseTextBounded(streamedResponse([chunk]), 3);
  assert.equal(text, "abc");
  assert.equal(getterCalls, 0);
});

test("M452 intrinsic byte length remains authoritative for the body ceiling", async () => {
  let cancelled = 0;
  const chunk = new Uint8Array([0x61, 0x62, 0x63]);
  Object.defineProperty(chunk, "byteLength", {
    configurable: true,
    get() { return 0; }
  });

  await assert.rejects(
    readResponseTextBounded(streamedResponse([chunk], () => { cancelled += 1; }), 2),
    /Remote list is too large/
  );
  assert.equal(cancelled, 1);
});
