import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function responseFromReader(reader) {
  return {
    headers: { get: () => null },
    body: { getReader: () => reader },
    text: async () => { throw new Error("text fallback should not run"); }
  };
}

test("M459 releases a captured reader lock after successful streaming", async () => {
  let reads = 0;
  let releases = 0;
  const reader = {
    read: async () => {
      reads += 1;
      return reads === 1
        ? { done: false, value: new TextEncoder().encode("ok\n") }
        : { done: true };
    },
    cancel: async () => {},
    releaseLock() { releases += 1; }
  };

  assert.equal(await readResponseTextBounded(responseFromReader(reader), 128), "ok\n");
  assert.equal(releases, 1);
});

test("M459 releases the reader lock after a primary streaming failure", async () => {
  let releases = 0;
  const primary = new Error("primary read failure");
  const reader = {
    read: async () => { throw primary; },
    cancel: async () => {},
    releaseLock() { releases += 1; }
  };

  await assert.rejects(readResponseTextBounded(responseFromReader(reader), 128), primary);
  assert.equal(releases, 1);
});

test("M459 releaseLock failure never replaces success or requires the optional collaborator", async () => {
  let step = 0;
  const throwingRelease = {
    read: async () => (++step === 1
      ? { done: false, value: new TextEncoder().encode("x") }
      : { done: true }),
    cancel: async () => {},
    releaseLock() { throw new Error("release failed"); }
  };
  assert.equal(await readResponseTextBounded(responseFromReader(throwingRelease), 128), "x");

  let noReleaseStep = 0;
  const noRelease = {
    read: async () => (++noReleaseStep === 1
      ? { done: false, value: new TextEncoder().encode("y") }
      : { done: true }),
    cancel: async () => {}
  };
  assert.equal(await readResponseTextBounded(responseFromReader(noRelease), 128), "y");
});
