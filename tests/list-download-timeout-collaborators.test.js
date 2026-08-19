import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("timeout controller accessors are rejected without getter execution", async () => {
  let getterCalls = 0;
  function UnsafeController() {
    const controller = { abort() {} };
    Object.defineProperty(controller, "signal", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return {};
      }
    });
    return controller;
  }

  await assert.rejects(
    withListDownloadTimeout(async () => "unused", { AbortControllerImpl: UnsafeController }),
    /signal must be an own enumerable data field/
  );
  assert.equal(getterCalls, 0);
});

test("throwing timeout cleanup cannot replace a successful task result", async () => {
  function SyntheticController() {
    return { signal: {}, abort() {} };
  }
  const value = await withListDownloadTimeout(async () => "ok", {
    AbortControllerImpl: SyntheticController,
    setTimeoutImpl() { return 123; },
    clearTimeoutImpl() { throw new Error("cleanup must be isolated"); }
  });
  assert.equal(value, "ok");
});

test("timeout uses the captured abort callback and still reports timeout when abort throws", async () => {
  let abortCalls = 0;
  let callback;
  function SyntheticController() {
    return {
      signal: {},
      abort() {
        abortCalls += 1;
        throw new Error("abort unavailable");
      }
    };
  }
  const operation = withListDownloadTimeout(() => new Promise(() => {}), {
    timeoutMs: 1,
    AbortControllerImpl: SyntheticController,
    setTimeoutImpl(handler) { callback = handler; return 1; },
    clearTimeoutImpl() {}
  });
  callback();
  await assert.rejects(operation, /List download timed out/);
  assert.equal(abortCalls, 1);
});
