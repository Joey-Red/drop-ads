import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

function PlainAbortController() {
  const signal = {};
  return {
    signal,
    abort() { signal.aborted = true; }
  };
}

test("M445 rejects a throwing timer arm before source work starts", async () => {
  let taskCalls = 0;
  await assert.rejects(
    withListDownloadTimeout(
      async () => { taskCalls += 1; },
      {
        timeoutMs: 25,
        setTimeoutImpl() { throw new Error("timer arm failed"); },
        clearTimeoutImpl() {},
        AbortControllerImpl: PlainAbortController
      }
    ),
    /timer arm failed/
  );
  assert.equal(taskCalls, 0);
});

test("M445 synchronous expiry fails before source work and clears the returned handle", async () => {
  let taskCalls = 0;
  let cleared = null;
  await assert.rejects(
    withListDownloadTimeout(
      async () => { taskCalls += 1; },
      {
        timeoutMs: 25,
        setTimeoutImpl(callback) {
          callback();
          return 77;
        },
        clearTimeoutImpl(handle) { cleared = handle; },
        AbortControllerImpl: PlainAbortController
      }
    ),
    /List download timed out/
  );
  assert.equal(taskCalls, 0);
  assert.equal(cleared, 77);
});

test("M445 successful work still clears an armed timeout", async () => {
  let cleared = null;
  const result = await withListDownloadTimeout(
    async () => "ok",
    {
      timeoutMs: 25,
      setTimeoutImpl() { return 91; },
      clearTimeoutImpl(handle) { cleared = handle; },
      AbortControllerImpl: PlainAbortController
    }
  );
  assert.equal(result, "ok");
  assert.equal(cleared, 91);
});
