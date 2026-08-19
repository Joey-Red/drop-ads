import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

function syntheticAbortControllerFactory(events) {
  return class SyntheticAbortController {
    constructor() {
      this.signal = { aborted: false };
      this.abort = () => {
        this.signal.aborted = true;
        events.push("abort");
      };
    }
  };
}

test("M451 throwing timeout arm performs zero source work", async () => {
  let taskCalls = 0;
  await assert.rejects(
    withListDownloadTimeout(
      async () => { taskCalls += 1; },
      {
        setTimeoutImpl() { throw new Error("timer unavailable"); },
        clearTimeoutImpl() {},
        AbortControllerImpl: syntheticAbortControllerFactory([])
      }
    ),
    /timer unavailable/
  );
  assert.equal(taskCalls, 0);
});

test("M451 synchronous timeout expiry aborts without starting source work or retaining a stale handle", async () => {
  const events = [];
  let taskCalls = 0;
  const returnedHandle = { id: 1 };
  const cleared = [];

  await assert.rejects(
    withListDownloadTimeout(
      async () => { taskCalls += 1; },
      {
        setTimeoutImpl(callback) {
          callback();
          return returnedHandle;
        },
        clearTimeoutImpl(handle) { cleared.push(handle); },
        AbortControllerImpl: syntheticAbortControllerFactory(events)
      }
    ),
    /List download timed out/
  );

  assert.equal(taskCalls, 0);
  assert.deepEqual(events, ["abort"]);
  assert.deepEqual(cleared, [returnedHandle]);
});

test("M451 normal operation arms first and preserves successful task result", async () => {
  const events = [];
  const order = [];
  let timeoutCallback;
  const handle = { id: 2 };
  const result = await withListDownloadTimeout(
    async () => {
      order.push("task");
      return "ok";
    },
    {
      setTimeoutImpl(callback) {
        order.push("arm");
        timeoutCallback = callback;
        return handle;
      },
      clearTimeoutImpl(value) {
        order.push("clear");
        assert.equal(value, handle);
      },
      AbortControllerImpl: syntheticAbortControllerFactory(events)
    }
  );

  assert.equal(typeof timeoutCallback, "function");
  assert.equal(result, "ok");
  assert.deepEqual(order, ["arm", "task", "clear"]);
  assert.deepEqual(events, []);
});
