import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function syntheticResponse(reader) {
  return {
    body: { getReader() { return reader; } },
    text() { throw new Error("stream path expected"); }
  };
}

test("M459 releases a captured reader lock after successful streamed decode", async () => {
  let reads = 0;
  let releases = 0;
  const reader = {
    read() {
      reads += 1;
      return reads === 1
        ? Promise.resolve({ done: false, value: new Uint8Array([0x61]) })
        : Promise.resolve({ done: true });
    },
    cancel() {},
    releaseLock() {
      releases += 1;
      throw new Error("cleanup failure must be isolated");
    }
  };

  const text = await readResponseTextBounded(syntheticResponse(reader), 16, { headersGet: () => null });
  assert.equal(text, "a");
  assert.equal(releases, 1);
});

test("M459 releases the captured reader lock after a contained stream failure", async () => {
  let releases = 0;
  const reader = {
    read() { return Promise.resolve({ done: false, value: "not-bytes" }); },
    cancel() {},
    releaseLock() { releases += 1; }
  };

  await assert.rejects(
    readResponseTextBounded(syntheticResponse(reader), 16, { headersGet: () => null }),
    /invalid byte chunk/
  );
  assert.equal(releases, 1);
});
