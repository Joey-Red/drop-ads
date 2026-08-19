import test from "node:test";
import assert from "node:assert/strict";

import { MAX_REMOTE_LIST_CHUNKS, readResponseTextBounded } from "../src/core/list-updates.js";

function responseFor(reader) {
  return {
    body: { getReader() { return reader; } },
    headers: { get() { return null; } },
    text() { throw new Error("text fallback should not run"); }
  };
}

test("M459 accepts exactly the reviewed nonterminal chunk ceiling", async () => {
  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads <= MAX_REMOTE_LIST_CHUNKS) return { done: false, value: new Uint8Array(0) };
      return { done: true };
    },
    async cancel() { throw new Error("cancel should not run"); }
  };

  assert.equal(await readResponseTextBounded(responseFor(reader), 1), "");
  assert.equal(reads, MAX_REMOTE_LIST_CHUNKS + 1);
});

test("M459 rejects the one-over chunk and cancels before further stream work", async () => {
  let reads = 0;
  let cancels = 0;
  const reader = {
    async read() {
      reads += 1;
      return { done: false, value: new Uint8Array(0) };
    },
    async cancel() { cancels += 1; }
  };

  await assert.rejects(
    () => readResponseTextBounded(responseFor(reader), 1),
    /too many chunks/
  );
  assert.equal(reads, MAX_REMOTE_LIST_CHUNKS + 1);
  assert.equal(cancels, 1);
});
