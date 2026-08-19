import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseWithReader(reader) {
  return {
    body: { getReader() { return reader; } },
    async text() { throw new Error("stream path expected"); }
  };
}

test("M459 successful streamed reads release the captured reader lock", async () => {
  let reads = 0;
  let releases = 0;
  const reader = {
    async read() {
      reads += 1;
      return reads === 1
        ? { done: false, value: new TextEncoder().encode("hello") }
        : { done: true };
    },
    async cancel() {},
    releaseLock() { releases += 1; }
  };
  assert.equal(await readResponseTextBounded(responseWithReader(reader), 100), "hello");
  assert.equal(releases, 1);
});

test("M459 read failures still release the lock without replacing the primary error", async () => {
  let releases = 0;
  const reader = {
    async read() { throw new Error("read failed"); },
    async cancel() {},
    releaseLock() { releases += 1; throw new Error("release failed"); }
  };
  await assert.rejects(readResponseTextBounded(responseWithReader(reader), 100), /read failed/);
  assert.equal(releases, 1);
});

test("M459 synthetic readers may omit releaseLock", async () => {
  let reads = 0;
  const reader = {
    async read() {
      reads += 1;
      return reads === 1
        ? { done: false, value: new TextEncoder().encode("ok") }
        : { done: true };
    },
    async cancel() {}
  };
  assert.equal(await readResponseTextBounded(responseWithReader(reader), 100), "ok");
});
