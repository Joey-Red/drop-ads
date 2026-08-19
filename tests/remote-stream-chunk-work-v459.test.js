import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_REMOTE_LIST_CHUNKS,
  readResponseTextBounded
} from "../src/core/list-updates.js";

function chunkResponse(nonterminalCount) {
  let reads = 0;
  let cancels = 0;
  let releases = 0;
  const empty = new Uint8Array(0);
  const reader = {
    async read() {
      reads += 1;
      if (reads <= nonterminalCount) return { done: false, value: empty };
      return { done: true };
    },
    async cancel() { cancels += 1; },
    releaseLock() { releases += 1; }
  };
  return {
    response: {
      body: { getReader() { return reader; } }
    },
    counts() { return { reads, cancels, releases }; }
  };
}

test("M459 accepts exactly the reviewed remote-list chunk ceiling", async () => {
  const harness = chunkResponse(MAX_REMOTE_LIST_CHUNKS);
  const text = await readResponseTextBounded(harness.response, 1, { headersGet: () => null });
  assert.equal(text, "");
  assert.deepEqual(harness.counts(), {
    reads: MAX_REMOTE_LIST_CHUNKS + 1,
    cancels: 0,
    releases: 1
  });
});

test("M459 rejects the one-over nonterminal chunk and cancels before completion", async () => {
  const harness = chunkResponse(MAX_REMOTE_LIST_CHUNKS + 1);
  await assert.rejects(
    readResponseTextBounded(harness.response, 1, { headersGet: () => null }),
    /Remote list body contains too many chunks/
  );
  assert.deepEqual(harness.counts(), {
    reads: MAX_REMOTE_LIST_CHUNKS + 1,
    cancels: 1,
    releases: 1
  });
});
