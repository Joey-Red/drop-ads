import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

class TestAbortController {
  constructor() {
    this.signal = { aborted: false };
    this.abort = () => { this.signal.aborted = true; };
  }
}

test("M447 throwing timer setup rejects before source task work", async () => {
  let taskCalls = 0;
  await assert.rejects(() => withListDownloadTimeout(() => {
    taskCalls += 1;
  }, {
    setTimeoutImpl() { throw new Error("timer setup failed"); },
    clearTimeoutImpl() {},
    AbortControllerImpl: TestAbortController
  }), /timer setup failed/);
  assert.equal(taskCalls, 0);
});

test("M447 synchronous timeout expiry aborts and rejects before source task admission", async () => {
  let taskCalls = 0;
  let cleared = null;
  const handle = { timer: true };

  await assert.rejects(() => withListDownloadTimeout(() => {
    taskCalls += 1;
  }, {
    setTimeoutImpl(callback) {
      callback();
      return handle;
    },
    clearTimeoutImpl(value) { cleared = value; },
    AbortControllerImpl: TestAbortController
  }), /timed out/);

  assert.equal(taskCalls, 0);
  assert.equal(cleared, handle);
});

test("M447 normally armed timeout still passes the captured signal and cleans up", async () => {
  let callback = null;
  let cleared = null;
  const handle = { timer: true };
  const result = await withListDownloadTimeout((signal) => {
    assert.equal(signal.aborted, false);
    return "ok";
  }, {
    setTimeoutImpl(fn) { callback = fn; return handle; },
    clearTimeoutImpl(value) { cleared = value; },
    AbortControllerImpl: TestAbortController
  });

  assert.equal(result, "ok");
  assert.equal(typeof callback, "function");
  assert.equal(cleared, handle);
});
