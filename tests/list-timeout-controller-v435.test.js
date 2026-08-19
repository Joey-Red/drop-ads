import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("M435 injected AbortController collaborators are admitted before timer/task work", async () => {
  let signalGetterCalls = 0;
  let schedules = 0;
  const controller = { abort() {} };
  Object.defineProperty(controller, "signal", { enumerable: true, get() { signalGetterCalls += 1; return {}; } });
  function FakeAbortController() { return controller; }
  await assert.rejects(withListDownloadTimeout(async () => "unreachable", {
    AbortControllerImpl: FakeAbortController,
    setTimeoutImpl() { schedules += 1; return 1; },
    clearTimeoutImpl() {}
  }), /AbortController signal.*own enumerable data field/i);
  assert.equal(signalGetterCalls, 0);
  assert.equal(schedules, 0);
});

test("M435 timer cleanup failure cannot replace a successful task result", async () => {
  const signal = { marker: true };
  const controller = { signal, abort() {} };
  function FakeAbortController() { return controller; }
  const value = await withListDownloadTimeout(async (receivedSignal) => {
    assert.equal(receivedSignal, signal);
    return "ok";
  }, {
    AbortControllerImpl: FakeAbortController,
    setTimeoutImpl() { return 7; },
    clearTimeoutImpl() { throw new Error("cleanup failure"); }
  });
  assert.equal(value, "ok");
});
