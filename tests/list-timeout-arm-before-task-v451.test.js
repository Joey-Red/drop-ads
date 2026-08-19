import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

function syntheticController(log) {
  return class {
    constructor() {
      this.signal = Object.freeze({ token: "signal" });
      this.abort = () => { log.push("abort"); };
    }
  };
}

test("M451 throwing timer prevents source task from starting", async () => {
  const log = [];
  await assert.rejects(
    withListDownloadTimeout(
      async () => { log.push("task"); },
      {
        AbortControllerImpl: syntheticController(log),
        setTimeoutImpl() { log.push("arm"); throw new Error("timer unavailable"); },
        clearTimeoutImpl() { log.push("clear"); }
      }
    ),
    /timer unavailable/
  );
  assert.deepEqual(log, ["arm"]);
});

test("M451 synchronous expiry prevents source task and clears the returned stale timer handle", async () => {
  const log = [];
  const handle = { id: 1 };
  await assert.rejects(
    withListDownloadTimeout(
      async () => { log.push("task"); },
      {
        AbortControllerImpl: syntheticController(log),
        setTimeoutImpl(callback) {
          log.push("arm");
          callback();
          log.push("return-handle");
          return handle;
        },
        clearTimeoutImpl(timer) { log.push(timer === handle ? "clear-handle" : "clear-other"); }
      }
    ),
    /List download timed out/
  );
  assert.deepEqual(log, ["arm", "abort", "return-handle", "clear-handle"]);
});

test("M451 normally armed timeout still races a source task and cleans the handle", async () => {
  const log = [];
  let timeoutCallback;
  const handle = { id: 2 };
  const result = await withListDownloadTimeout(
    async (signal) => { log.push(signal.token); return "ok"; },
    {
      AbortControllerImpl: syntheticController(log),
      setTimeoutImpl(callback) { timeoutCallback = callback; log.push("arm"); return handle; },
      clearTimeoutImpl(timer) { log.push(timer === handle ? "clear-handle" : "clear-other"); }
    }
  );
  assert.equal(typeof timeoutCallback, "function");
  assert.equal(result, "ok");
  assert.deepEqual(log, ["arm", "signal", "clear-handle"]);
});
