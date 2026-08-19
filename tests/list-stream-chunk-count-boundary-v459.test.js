import test from "node:test";
import assert from "node:assert/strict";
import { MAX_REMOTE_LIST_CHUNKS, readResponseTextBounded } from "../src/core/list-updates.js";

function streamedResponse(nonterminalChunks, counters = {}) {
  let reads = 0;
  counters.cancel = 0;
  return {
    body: {
      getReader() {
        return {
          async read() {
            reads += 1;
            if (reads <= nonterminalChunks) return { done: false, value: new Uint8Array(0) };
            return { done: true };
          },
          async cancel() { counters.cancel += 1; }
        };
      }
    },
    async text() { throw new Error("stream path expected"); }
  };
}

test("M459 accepts exactly the reviewed nonterminal stream chunk ceiling", async () => {
  assert.equal(MAX_REMOTE_LIST_CHUNKS, 65_536);
  const counters = {};
  const text = await readResponseTextBounded(streamedResponse(MAX_REMOTE_LIST_CHUNKS, counters));
  assert.equal(text, "");
  assert.equal(counters.cancel, 0);
});

test("M459 rejects the one-over nonterminal chunk and cancels best effort", async () => {
  const counters = {};
  await assert.rejects(
    readResponseTextBounded(streamedResponse(MAX_REMOTE_LIST_CHUNKS + 1, counters)),
    /too many chunks/i
  );
  assert.equal(counters.cancel, 1);
});
