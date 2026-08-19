import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("M439 captures injected AbortController signal/abort before timeout work", async () => {
  let instance;
  let scheduled;
  let capturedSignal;
  let originalAbortCalls = 0;
  let replacementAbortCalls = 0;

  function AbortControllerImpl() {
    instance = {
      signal: Object.freeze({ token: "signal" }),
      abort() { originalAbortCalls += 1; }
    };
    return instance;
  }

  const operation = withListDownloadTimeout(
    (signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    },
    {
      timeoutMs: 10,
      setTimeoutImpl(callback) {
        scheduled = callback;
        return 1;
      },
      clearTimeoutImpl() {},
      AbortControllerImpl
    }
  );

  await Promise.resolve();
  instance.abort = () => { replacementAbortCalls += 1; };
  scheduled();

  await assert.rejects(operation, /List download timed out/);
  assert.equal(capturedSignal, instance.signal);
  assert.equal(originalAbortCalls, 1);
  assert.equal(replacementAbortCalls, 0);
});

test("M439 rejects accessor-backed injected controller collaborators without executing getters", async () => {
  let signalGetterCalls = 0;
  let scheduled = false;
  let taskCalls = 0;

  function AbortControllerImpl() {
    const controller = { abort() {} };
    Object.defineProperty(controller, "signal", {
      enumerable: true,
      get() {
        signalGetterCalls += 1;
        return {};
      }
    });
    return controller;
  }

  await assert.rejects(
    withListDownloadTimeout(
      () => {
        taskCalls += 1;
        return "unexpected";
      },
      {
        setTimeoutImpl() {
          scheduled = true;
          return 1;
        },
        clearTimeoutImpl() {},
        AbortControllerImpl
      }
    ),
    /signal must be an own enumerable data field/
  );

  assert.equal(signalGetterCalls, 0);
  assert.equal(scheduled, false);
  assert.equal(taskCalls, 0);
});

test("M439 timer cleanup failure cannot replace a successful task result", async () => {
  function AbortControllerImpl() {
    return { signal: {}, abort() {} };
  }

  const result = await withListDownloadTimeout(
    () => "ok",
    {
      setTimeoutImpl() { return 1; },
      clearTimeoutImpl() { throw new Error("cleanup failed"); },
      AbortControllerImpl
    }
  );

  assert.equal(result, "ok");
});
