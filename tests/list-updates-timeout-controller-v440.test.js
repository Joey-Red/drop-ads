import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M440 injected AbortController collaborators are captured before timer/task work", async () => {
  let aborted = 0;
  let taskSignal = null;
  const signal = { aborted: false };
  function InjectedController() {
    return {
      signal,
      abort() { aborted += 1; }
    };
  }
  let scheduled = null;
  const result = await withListDownloadTimeout(
    async (receivedSignal) => { taskSignal = receivedSignal; return "ok"; },
    {
      AbortControllerImpl: InjectedController,
      setTimeoutImpl(callback) { scheduled = callback; return 123; },
      clearTimeoutImpl() { throw new Error("cleanup failure"); }
    }
  );
  assert.equal(result, "ok");
  assert.equal(taskSignal, signal);
  assert.equal(aborted, 0);
  assert.equal(typeof scheduled, "function");
});

test("M440 injected AbortController accessors are rejected without execution", async () => {
  let getterCalls = 0;
  function InjectedController() {
    const controller = {};
    Object.defineProperty(controller, "signal", {
      enumerable: true,
      get() { getterCalls += 1; return { aborted: false }; }
    });
    Object.defineProperty(controller, "abort", { enumerable: true, value() {} });
    return controller;
  }
  await assert.rejects(
    () => withListDownloadTimeout(async () => "never", { AbortControllerImpl: InjectedController }),
    /Injected AbortController signal must be an own enumerable data field/
  );
  assert.equal(getterCalls, 0);
});

test("M440 timeout cleanup detaches timer identity before best-effort clear", () => {
  assert.match(source, /const timerToClear = timer;\s*timer = null;\s*clearTimeoutBestEffort\(clearTimeoutImpl, timerToClear\);/s);
  assert.match(source, /captureAbortControllerCollaborators\(controller\)/);
  assert.doesNotMatch(source, /controller\.abort\(/);
  assert.doesNotMatch(source, /controller\.signal/);
});
