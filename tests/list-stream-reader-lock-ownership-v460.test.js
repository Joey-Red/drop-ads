import test from "node:test";
import assert from "node:assert/strict";
import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseWithReader(reader) {
  return {
    body: { getReader() { return reader; } },
    async text() { throw new Error("stream path expected"); }
  };
}

test("M460 terminal completion releases the captured reader lock exactly once", async () => {
  let reads = 0;
  let originalReleases = 0;
  let redirectedReleases = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads === 1) {
        reader.releaseLock = () => { redirectedReleases += 1; };
        return { done: false, value: new TextEncoder().encode("ok") };
      }
      return { done: true };
    },
    async cancel() {},
    releaseLock() { originalReleases += 1; }
  };

  assert.equal(await readResponseTextBounded(responseWithReader(reader), 100), "ok");
  assert.equal(originalReleases, 1);
  assert.equal(redirectedReleases, 0);
});

test("M460 invalid streamed data cancels and releases exactly once", async () => {
  let cancels = 0;
  let releases = 0;
  const reader = {
    async read() { return { done: false, value: "not-bytes" }; },
    async cancel() { cancels += 1; },
    releaseLock() { releases += 1; }
  };

  await assert.rejects(
    readResponseTextBounded(responseWithReader(reader), 100),
    /invalid byte chunk/
  );
  assert.equal(cancels, 1);
  assert.equal(releases, 1);
});

test("M460 reader-lock cleanup failure never replaces the primary read error", async () => {
  let releases = 0;
  const reader = {
    async read() { throw new Error("primary read failure"); },
    async cancel() {},
    releaseLock() {
      releases += 1;
      throw new Error("cleanup failure");
    }
  };

  await assert.rejects(
    readResponseTextBounded(responseWithReader(reader), 100),
    /primary read failure/
  );
  assert.equal(releases, 1);
});
