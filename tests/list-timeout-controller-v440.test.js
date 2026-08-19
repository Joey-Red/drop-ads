import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("M440 synthetic AbortController collaborators are captured and stale timeout callbacks stay inert", async () => {
  let abortCalls = 0;
  let taskSignal;
  let scheduled;
  class SyntheticController {
    constructor() {
      this.signal = { token: "stable" };
      this.abort = () => { abortCalls += 1; };
    }
  }

  const resultPromise = withListDownloadTimeout(
    async (signal) => { taskSignal = signal; return "ok"; },
    {
      timeoutMs: 10,
      AbortControllerImpl: SyntheticController,
      setTimeoutImpl(callback) { scheduled = callback; return 7; },
      clearTimeoutImpl() {}
    }
  );
  assert.equal(await resultPromise, "ok");
  assert.deepEqual(taskSignal, { token: "stable" });
  scheduled();
  assert.equal(abortCalls, 0, "a stale timer callback must not abort after the task has completed");
});

test("M440 accessor-shaped synthetic controller fails before timer/task work", async () => {
  let scheduled = 0;
  let taskCalls = 0;
  let getterCalls = 0;
  class SyntheticController {
    constructor() {
      Object.defineProperty(this, "signal", {
        enumerable: true,
        get() { getterCalls += 1; return {}; }
      });
      this.abort = () => {};
    }
  }

  await assert.rejects(withListDownloadTimeout(
    async () => { taskCalls += 1; },
    {
      AbortControllerImpl: SyntheticController,
      setTimeoutImpl() { scheduled += 1; return 1; },
      clearTimeoutImpl() {}
    }
  ));
  assert.equal(getterCalls, 0);
  assert.equal(scheduled, 0);
  assert.equal(taskCalls, 0);
});

test("M440 throwing timer cleanup cannot replace successful task result", async () => {
  class SyntheticController {
    constructor() { this.signal = {}; this.abort = () => {}; }
  }
  const result = await withListDownloadTimeout(
    async () => "success",
    {
      AbortControllerImpl: SyntheticController,
      setTimeoutImpl() { return 1; },
      clearTimeoutImpl() { throw new Error("cleanup failed"); }
    }
  );
  assert.equal(result, "success");
});
