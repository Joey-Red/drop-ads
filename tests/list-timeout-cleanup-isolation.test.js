import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

function FakeAbortController() {
  return {
    signal: {},
    abort() {}
  };
}

test("throwing timer cleanup cannot replace a successful list task result", async () => {
  const result = await withListDownloadTimeout(
    async () => "ok",
    {
      timeoutMs: 100,
      setTimeoutImpl() { return 9; },
      clearTimeoutImpl() { throw new Error("cleanup failed"); },
      AbortControllerImpl: FakeAbortController
    }
  );
  assert.equal(result, "ok");
});

test("throwing timer cleanup cannot replace the actionable list task failure", async () => {
  await assert.rejects(
    () => withListDownloadTimeout(
      async () => { throw new Error("source failed"); },
      {
        timeoutMs: 100,
        setTimeoutImpl() { return 9; },
        clearTimeoutImpl() { throw new Error("cleanup failed"); },
        AbortControllerImpl: FakeAbortController
      }
    ),
    /source failed/
  );
});

test("timer identity is detached before external cleanup is invoked", async () => {
  let clearCalls = 0;
  const result = await withListDownloadTimeout(
    async () => 42,
    {
      timeoutMs: 100,
      setTimeoutImpl() { return 17; },
      clearTimeoutImpl(timer) {
        clearCalls += 1;
        assert.equal(timer, 17);
      },
      AbortControllerImpl: FakeAbortController
    }
  );
  assert.equal(result, 42);
  assert.equal(clearCalls, 1);
});
