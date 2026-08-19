import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("M438 preserves native AbortController signal delivery", async () => {
  const result = await withListDownloadTimeout(
    async (signal) => signal instanceof AbortSignal,
    { timeoutMs: 100, setTimeoutImpl: () => 1, clearTimeoutImpl: () => {} }
  );
  assert.equal(result, true);
});

test("M438 captures synthetic signal and abort before task scheduling", async () => {
  let timeoutCallback;
  let abortCalls = 0;
  let taskCalls = 0;
  const signal = { aborted: false };
  class SyntheticAbortController {
    constructor() {
      this.signal = signal;
      this.abort = () => { abortCalls += 1; signal.aborted = true; };
    }
  }
  const promise = withListDownloadTimeout(
    async (receivedSignal) => {
      taskCalls += 1;
      assert.equal(receivedSignal, signal);
      return new Promise(() => {});
    },
    {
      timeoutMs: 10,
      AbortControllerImpl: SyntheticAbortController,
      setTimeoutImpl(callback) { timeoutCallback = callback; return 1; },
      clearTimeoutImpl() {}
    }
  );
  assert.equal(typeof timeoutCallback, "function");
  timeoutCallback();
  await assert.rejects(() => promise, /List download timed out/);
  assert.equal(taskCalls, 1);
  assert.equal(abortCalls, 1);
});

test("M438 rejects accessor-backed synthetic controller collaborators before scheduling", async () => {
  let getterRuns = 0;
  let scheduled = 0;
  class SyntheticAbortController {
    constructor() {
      Object.defineProperty(this, "signal", {
        enumerable: true,
        get() { getterRuns += 1; return {}; }
      });
      this.abort = () => {};
    }
  }
  await assert.rejects(
    () => withListDownloadTimeout(async () => true, {
      AbortControllerImpl: SyntheticAbortController,
      setTimeoutImpl() { scheduled += 1; return 1; },
      clearTimeoutImpl() {}
    }),
    /AbortController signal/
  );
  assert.equal(getterRuns, 0);
  assert.equal(scheduled, 0);
});

test("M438 timer cleanup failure cannot replace a successful task result", async () => {
  const result = await withListDownloadTimeout(
    async () => "kept",
    {
      timeoutMs: 100,
      setTimeoutImpl: () => 1,
      clearTimeoutImpl() { throw new Error("cleanup failure"); }
    }
  );
  assert.equal(result, "kept");
});
