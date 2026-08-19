import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

function controllerHarness(state) {
  return function AbortControllerImpl() {
    return {
      signal: { token: "signal" },
      abort() { state.aborts += 1; }
    };
  };
}

test("M439 throwing timer admission starts no source work", async () => {
  const state = { aborts: 0, tasks: 0 };
  const expected = new Error("timer unavailable");
  await assert.rejects(
    withListDownloadTimeout(
      async () => { state.tasks += 1; },
      {
        timeoutMs: 10,
        setTimeoutImpl() { throw expected; },
        clearTimeoutImpl() {},
        AbortControllerImpl: controllerHarness(state)
      }
    ),
    (error) => error === expected
  );
  assert.equal(state.tasks, 0);
  assert.equal(state.aborts, 0);
});

test("M439 synchronous timeout expiry aborts and fails before source work", async () => {
  const state = { aborts: 0, tasks: 0, cleared: [] };
  const handle = { timer: 1 };
  await assert.rejects(
    withListDownloadTimeout(
      async () => { state.tasks += 1; },
      {
        timeoutMs: 10,
        setTimeoutImpl(callback) {
          callback();
          return handle;
        },
        clearTimeoutImpl(value) { state.cleared.push(value); },
        AbortControllerImpl: controllerHarness(state)
      }
    ),
    /List download timed out/
  );
  assert.equal(state.tasks, 0);
  assert.equal(state.aborts, 1);
  assert.deepEqual(state.cleared, [handle]);
});

test("M439 successful arm runs source work and releases timer identity", async () => {
  const state = { aborts: 0, tasks: 0, cleared: [] };
  const handle = { timer: 2 };
  const result = await withListDownloadTimeout(
    async (signal) => {
      state.tasks += 1;
      assert.equal(signal.token, "signal");
      return "ok";
    },
    {
      timeoutMs: 10,
      setTimeoutImpl() { return handle; },
      clearTimeoutImpl(value) { state.cleared.push(value); },
      AbortControllerImpl: controllerHarness(state)
    }
  );
  assert.equal(result, "ok");
  assert.equal(state.tasks, 1);
  assert.equal(state.aborts, 0);
  assert.deepEqual(state.cleared, [handle]);
});
