import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("M447 throwing timer setup prevents source work", async () => {
  let taskCalls = 0;
  await assert.rejects(
    withListDownloadTimeout(() => { taskCalls += 1; }, {
      setTimeoutImpl() { throw new Error("timer unavailable"); }
    }),
    /timer unavailable/
  );
  assert.equal(taskCalls, 0);
});

test("M447 synchronous timeout expiry prevents source work and aborts", async () => {
  let taskCalls = 0;
  let abortCalls = 0;
  let cleared = null;
  function AbortControllerImpl() {
    return {
      signal: { aborted: false },
      abort() { abortCalls += 1; }
    };
  }
  await assert.rejects(
    withListDownloadTimeout(() => { taskCalls += 1; }, {
      AbortControllerImpl,
      setTimeoutImpl(callback) {
        callback();
        return 73;
      },
      clearTimeoutImpl(handle) { cleared = handle; }
    }),
    /List download timed out/
  );
  assert.equal(taskCalls, 0);
  assert.equal(abortCalls, 1);
  assert.equal(cleared, 73);
});

test("M447 normal timeout still races an admitted source task", async () => {
  let timeoutCallback;
  let taskCalls = 0;
  const work = withListDownloadTimeout(async () => {
    taskCalls += 1;
    return "ok";
  }, {
    setTimeoutImpl(callback) { timeoutCallback = callback; return 1; },
    clearTimeoutImpl() {}
  });
  assert.equal(await work, "ok");
  assert.equal(taskCalls, 1);
  assert.equal(typeof timeoutCallback, "function");
});
