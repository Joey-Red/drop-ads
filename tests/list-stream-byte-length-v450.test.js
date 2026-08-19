import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseForChunks(chunks) {
  let index = 0;
  const reader = {
    read: async () => index < chunks.length
      ? { done: false, value: chunks[index++] }
      : { done: true }
  };
  return {
    body: {
      getReader: () => reader
    }
  };
}

test("M450 streamed byte accounting ignores a shadowing byteLength getter", async () => {
  let getterCalls = 0;
  class HostileChunk extends Uint8Array {
    get byteLength() {
      getterCalls += 1;
      throw new Error("shadow byteLength getter executed");
    }
  }

  const text = await readResponseTextBounded(responseForChunks([new HostileChunk([65, 66, 67])]), 3);
  assert.equal(text, "ABC");
  assert.equal(getterCalls, 0);
});

test("M450 intrinsic byte length remains authoritative for overflow", async () => {
  await assert.rejects(
    readResponseTextBounded(responseForChunks([new Uint8Array([65, 66, 67])]), 2),
    /Remote list is too large/
  );
});
