import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

function syntheticSignal() {
  return {
    aborted: false,
    addEventListener() {},
    removeEventListener() {}
  };
}

test("M438 rejects an accessor-backed injected controller before timer/task work", async () => {
  let signalReads = 0;
  let timerCalls = 0;
  let taskCalls = 0;

  function BadController() {
    Object.defineProperty(this, "signal", {
      enumerable: true,
      get() {
        signalReads += 1;
        return syntheticSignal();
      }
    });
    this.abort = () => {};
  }

  await assert.rejects(
    () => withListDownloadTimeout(
      async () => {
        taskCalls += 1;
      },
      {
        AbortControllerImpl: BadController,
        setTimeoutImpl() {
          timerCalls += 1;
          return 1;
        },
        clearTimeoutImpl() {}
      }
    ),
    /signal must be an own enumerable data field/
  );
  assert.equal(signalReads, 0);
  assert.equal(timerCalls, 0);
  assert.equal(taskCalls, 0);
});

test("M438 captures abort once and throwing timer cleanup cannot replace success", async () => {
  let controller;
  let abortCalls = 0;
  let replacementAbortCalls = 0;

  function GoodController() {
    controller = this;
    this.signal = syntheticSignal();
    this.abort = () => {
      abortCalls += 1;
      this.signal.aborted = true;
    };
  }

  const result = await withListDownloadTimeout(
    async (signal) => {
      assert.equal(signal, controller.signal);
      controller.abort = () => {
        replacementAbortCalls += 1;
      };
      return "ok";
    },
    {
      AbortControllerImpl: GoodController,
      setTimeoutImpl() {
        return 1;
      },
      clearTimeoutImpl() {
        throw new Error("cleanup failure");
      }
    }
  );

  assert.equal(result, "ok");
  assert.equal(abortCalls, 0);
  assert.equal(replacementAbortCalls, 0);
});

test("M438 timeout uses the originally captured receiver-bound abort", async () => {
  let controller;
  let fireTimeout;
  let abortCalls = 0;
  let replacementAbortCalls = 0;

  function GoodController() {
    controller = this;
    this.signal = syntheticSignal();
    this.abort = () => {
      abortCalls += 1;
      this.signal.aborted = true;
    };
  }

  const pending = withListDownloadTimeout(
    () => new Promise(() => {}),
    {
      AbortControllerImpl: GoodController,
      setTimeoutImpl(callback) {
        fireTimeout = callback;
        return 1;
      },
      clearTimeoutImpl() {}
    }
  );

  controller.abort = () => {
    replacementAbortCalls += 1;
  };
  fireTimeout();

  await assert.rejects(pending, /List download timed out/);
  assert.equal(abortCalls, 1);
  assert.equal(replacementAbortCalls, 0);
});
