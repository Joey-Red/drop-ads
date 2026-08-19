import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseForChunks(chunks) {
  let index = 0;
  return {
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) return { done: true };
            return { done: false, value: chunks[index++] };
          },
          async cancel() {}
        };
      }
    },
    text: async () => ""
  };
}

test("M452 streamed byte accounting does not execute a shadow byteLength getter", async () => {
  let getterReads = 0;
  class Chunk extends Uint8Array {}
  const chunk = new Chunk([0x61, 0x62, 0x63]);
  Object.defineProperty(chunk, "byteLength", {
    configurable: true,
    get() {
      getterReads += 1;
      throw new Error("shadow getter must not run");
    }
  });

  const text = await readResponseTextBounded(responseForChunks([chunk]), 3);
  assert.equal(text, "abc");
  assert.equal(getterReads, 0);
});

test("M452 intrinsic chunk length still enforces the byte ceiling", async () => {
  const chunk = new Uint8Array([0x61, 0x62, 0x63]);
  await assert.rejects(readResponseTextBounded(responseForChunks([chunk]), 2), /Remote list is too large/);
});
