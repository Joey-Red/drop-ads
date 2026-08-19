import test from "node:test";
import assert from "node:assert/strict";

import { readResponseTextBounded } from "../src/core/list-updates.js";

function dataResponse(body) {
  return {
    body,
    headers: { get() { return null; } },
    text() { throw new Error("text fallback should not run"); }
  };
}

test("M436 captures reader read/cancel operations once", async () => {
  let reads = 0;
  let cancels = 0;
  const reader = {
    async read() {
      reads += 1;
      if (reads === 1) {
        reader.read = () => { throw new Error("mutated read must not run"); };
        reader.cancel = () => { throw new Error("mutated cancel must not run"); };
        return { done: false, value: new TextEncoder().encode("ok") };
      }
      return { done: true };
    },
    async cancel() { cancels += 1; }
  };
  const body = { getReader() { return reader; } };

  assert.equal(await readResponseTextBounded(dataResponse(body), 32), "ok");
  assert.equal(reads, 2);
  assert.equal(cancels, 0);
});

test("M436 uses captured cancel when an admission failure occurs", async () => {
  let cancels = 0;
  const reader = {
    async read() {
      reader.cancel = () => { throw new Error("mutated cancel must not run"); };
      return { done: false, value: new TextEncoder().encode("too-large") };
    },
    async cancel() { cancels += 1; }
  };
  const body = { getReader() { return reader; } };

  await assert.rejects(() => readResponseTextBounded(dataResponse(body), 2), /Remote list is too large/);
  assert.equal(cancels, 1);
});

test("M436 rejects accessor-backed synthetic reader methods without executing them", async () => {
  let getterRuns = 0;
  const reader = {};
  Object.defineProperty(reader, "read", {
    enumerable: true,
    get() {
      getterRuns += 1;
      return async () => ({ done: true });
    }
  });
  const body = { getReader() { return reader; } };

  await assert.rejects(() => readResponseTextBounded(dataResponse(body), 32), /reader read/);
  assert.equal(getterRuns, 0);
});
