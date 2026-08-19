import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

class SyntheticAbortController {
  constructor() {
    Object.defineProperty(this, "signal", { enumerable: true, configurable: true, writable: true, value: { aborted: false } });
    Object.defineProperty(this, "abort", { enumerable: true, configurable: true, writable: true, value: () => { this.signal.aborted = true; } });
  }
}

test("M447 throwing timer setup fails before task work", async () => {
  let taskCalls = 0;
  await assert.rejects(
    withListDownloadTimeout(async () => { taskCalls += 1; }, {
      timeoutMs: 1,
      AbortControllerImpl: SyntheticAbortController,
      setTimeoutImpl() { throw new Error("timer setup failed"); },
      clearTimeoutImpl() {}
    }),
    /timer setup failed/
  );
  assert.equal(taskCalls, 0);
});

test("M447 synchronous timeout expiry aborts without starting task", async () => {
  let taskCalls = 0;
  let cleared = 0;
  await assert.rejects(
    withListDownloadTimeout(async () => { taskCalls += 1; }, {
      timeoutMs: 1,
      AbortControllerImpl: SyntheticAbortController,
      setTimeoutImpl(callback) {
        callback();
        return 17;
      },
      clearTimeoutImpl(handle) {
        assert.equal(handle, 17);
        cleared += 1;
      }
    }),
    /List download timed out/
  );
  assert.equal(taskCalls, 0);
  assert.equal(cleared, 1);
});

test("M447 synchronous expiry remains authoritative when cleanup throws", async () => {
  let taskCalls = 0;
  await assert.rejects(
    withListDownloadTimeout(async () => { taskCalls += 1; }, {
      timeoutMs: 1,
      AbortControllerImpl: SyntheticAbortController,
      setTimeoutImpl(callback) {
        callback();
        return 23;
      },
      clearTimeoutImpl() { throw new Error("cleanup failed"); }
    }),
    /List download timed out/
  );
  assert.equal(taskCalls, 0);
});
