import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function streamingResponse(chunks) {
  let index = 0;
  let canceled = false;
  return {
    response: {
      headers: { get() { return null; } },
      body: {
        getReader() {
          return {
            async read() {
              if (index >= chunks.length) return { done: true, value: undefined };
              return { done: false, value: Uint8Array.from(chunks[index++]) };
            },
            async cancel() { canceled = true; }
          };
        }
      }
    },
    wasCanceled() { return canceled; }
  };
}

test("strict UTF-8 decoder preserves valid multibyte code points split across chunks", async () => {
  const source = streamingResponse([
    [0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x20],
    [0xe4],
    [0xb8, 0xad],
    [0x0a]
  ]);
  assert.equal(await readResponseTextBounded(source.response), "block 中\n");
  assert.equal(source.wasCanceled(), false);
});

test("malformed UTF-8 is rejected and the reader is canceled", async () => {
  const source = streamingResponse([[0x61, 0xc3, 0x28, 0x0a]]);
  await assert.rejects(() => readResponseTextBounded(source.response), /not valid UTF-8/);
  assert.equal(source.wasCanceled(), true);
});

test("truncated final UTF-8 sequence is rejected at stream finalization", async () => {
  const source = streamingResponse([[0x61, 0x0a, 0xe2, 0x82]]);
  await assert.rejects(() => readResponseTextBounded(source.response), /not valid UTF-8/);
  assert.equal(source.wasCanceled(), true);
});
