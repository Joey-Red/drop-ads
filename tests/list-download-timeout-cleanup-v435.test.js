import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("M435 throwing timer cleanup cannot replace a successful task result", async () => {
  const result = await withListDownloadTimeout(
    async () => "ok",
    {
      timeoutMs: 1_000,
      setTimeoutImpl(callback) { return { callback }; },
      clearTimeoutImpl() { throw new Error("cleanup failed"); },
      AbortControllerImpl: AbortController
    }
  );
  assert.equal(result, "ok");
});

test("M435 throwing timer cleanup cannot replace the actionable task failure", async () => {
  await assert.rejects(
    withListDownloadTimeout(
      async () => { throw new Error("task failed"); },
      {
        timeoutMs: 1_000,
        setTimeoutImpl(callback) { return { callback }; },
        clearTimeoutImpl() { throw new Error("cleanup failed"); },
        AbortControllerImpl: AbortController
      }
    ),
    /task failed/
  );
});
