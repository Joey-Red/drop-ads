import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

function syntheticController() {
  const signal = Object.create(null);
  signal.aborted = false;
  const controller = Object.create(null);
  controller.signal = signal;
  controller.abort = function abort() { signal.aborted = true; };
  return controller;
}

test("M438 timeout cleanup cannot replace a successful task result", async () => {
  let scheduled = null;
  const result = await withListDownloadTimeout(
    async (signal) => {
      assert.equal(signal.aborted, false);
      return "ok";
    },
    {
      timeoutMs: 25,
      AbortControllerImpl: function AbortControllerImpl() { return syntheticController(); },
      setTimeoutImpl(callback) {
        scheduled = callback;
        return 7;
      },
      clearTimeoutImpl() { throw new Error("cleanup failure"); }
    }
  );
  assert.equal(result, "ok");
  assert.equal(typeof scheduled, "function");
});

test("M438 synthetic controller accessors fail before timer scheduling", async () => {
  let scheduled = false;
  function BadController() {
    const value = Object.create(null);
    Object.defineProperty(value, "signal", {
      enumerable: true,
      get() { throw new Error("must not execute"); }
    });
    value.abort = () => {};
    return value;
  }

  await assert.rejects(
    withListDownloadTimeout(async () => "unused", {
      AbortControllerImpl: BadController,
      setTimeoutImpl() {
        scheduled = true;
        return 1;
      },
      clearTimeoutImpl() {}
    }),
    /signal must be an own enumerable data field/
  );
  assert.equal(scheduled, false);
});
