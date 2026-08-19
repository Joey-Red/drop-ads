import test from "node:test";
import assert from "node:assert/strict";
import { MAX_LIST_DOWNLOAD_TIMEOUT_MS, withListDownloadTimeout } from "../src/core/list-updates.js";

function fakeTimers({ fireImmediately = false } = {}) {
  let cleared = 0;
  let callback = null;
  let scheduled = 0;
  return {
    setTimeoutImpl(fn) {
      scheduled += 1;
      callback = fn;
      if (fireImmediately) queueMicrotask(fn);
      return 17;
    },
    clearTimeoutImpl(id) {
      assert.equal(id, 17);
      cleared += 1;
    },
    fire() { callback?.(); },
    cleared() { return cleared; },
    scheduled() { return scheduled; }
  };
}

function optionsFor(timers, timeoutMs = 30_000) {
  return {
    timeoutMs,
    setTimeoutImpl: timers.setTimeoutImpl,
    clearTimeoutImpl: timers.clearTimeoutImpl
  };
}

test("stalled work times out even when the task ignores AbortSignal", async () => {
  const timers = fakeTimers({ fireImmediately: true });
  let observedSignal = null;
  await assert.rejects(() => withListDownloadTimeout((signal) => {
    observedSignal = signal;
    return new Promise(() => {});
  }, optionsFor(timers)), /timed out/);
  assert.equal(observedSignal?.aborted, true);
  assert.equal(timers.cleared(), 1);
});

test("successful work clears timeout resources without aborting", async () => {
  const timers = fakeTimers();
  let observedSignal = null;
  const result = await withListDownloadTimeout(async (signal) => {
    observedSignal = signal;
    return "ok";
  }, optionsFor(timers));
  assert.equal(result, "ok");
  assert.equal(observedSignal?.aborted, false);
  assert.equal(timers.cleared(), 1);
});

test("task failure also clears timeout resources and preserves the original failure", async () => {
  const timers = fakeTimers();
  await assert.rejects(() => withListDownloadTimeout(async () => {
    throw new Error("upstream failed");
  }, optionsFor(timers)), /upstream failed/);
  assert.equal(timers.cleared(), 1);
});

test("timeout options accept the exact upper bound and reject one-over before side effects", async () => {
  const acceptedTimers = fakeTimers();
  assert.equal(await withListDownloadTimeout(async () => "ok", optionsFor(acceptedTimers, MAX_LIST_DOWNLOAD_TIMEOUT_MS)), "ok");
  assert.equal(acceptedTimers.scheduled(), 1);

  const rejectedTimers = fakeTimers();
  let taskCalls = 0;
  await assert.rejects(() => withListDownloadTimeout(async () => { taskCalls += 1; }, optionsFor(rejectedTimers, MAX_LIST_DOWNLOAD_TIMEOUT_MS + 1)), /1 through 120000/i);
  assert.equal(taskCalls, 0);
  assert.equal(rejectedTimers.scheduled(), 0);
});

test("timeout option schema rejects unknown fields and accessors before side effects", async () => {
  let taskCalls = 0;
  let getterCalls = 0;
  const accessor = {};
  Object.defineProperty(accessor, "timeoutMs", {
    enumerable: true,
    get() { getterCalls += 1; return 30_000; }
  });
  await assert.rejects(() => withListDownloadTimeout(async () => { taskCalls += 1; }, accessor), /data field/i);
  assert.equal(getterCalls, 0);
  assert.equal(taskCalls, 0);

  await assert.rejects(() => withListDownloadTimeout(async () => { taskCalls += 1; }, { timeoutMs: 30_000, surprise: true }), /unsupported field/i);
  assert.equal(taskCalls, 0);
});
