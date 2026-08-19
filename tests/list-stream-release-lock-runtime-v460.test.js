import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseFor(reader) {
  return {
    body: { getReader() { return reader; } },
    headers: { get() { return null; } },
    text() { throw new Error("text fallback should not run"); }
  };
}

test("M460 successful completion releases the originally captured lock once", async () => {
  let releases = 0;
  const reader = {
    async read() {
      reader.releaseLock = () => { throw new Error("mutated releaseLock must not run"); };
      return { done: true };
    },
    async cancel() { throw new Error("cancel should not run"); },
    releaseLock() { releases += 1; }
  };

  assert.equal(await readResponseTextBounded(responseFor(reader), 32), "");
  assert.equal(releases, 1);
});

test("M460 invalid streamed data cancels and releases the lock once", async () => {
  let cancels = 0;
  let releases = 0;
  const reader = {
    async read() { return { done: false, value: "not-bytes" }; },
    async cancel() { cancels += 1; },
    releaseLock() { releases += 1; }
  };

  await assert.rejects(
    () => readResponseTextBounded(responseFor(reader), 32),
    /invalid byte chunk/
  );
  assert.equal(cancels, 1);
  assert.equal(releases, 1);
});

test("M460 releaseLock cleanup failure cannot replace successful completion", async () => {
  const reader = {
    async read() { return { done: true }; },
    releaseLock() { throw new Error("cleanup failed"); }
  };

  assert.equal(await readResponseTextBounded(responseFor(reader), 32), "");
});
