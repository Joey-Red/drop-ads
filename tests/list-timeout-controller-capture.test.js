import test from "node:test";
import assert from "node:assert/strict";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("throwing timer cleanup cannot replace a successful list task", async () => {
  const result = await withListDownloadTimeout(async () => "ok", {
    timeoutMs: 10,
    setTimeoutImpl() { return 7; },
    clearTimeoutImpl() { throw new Error("cleanup failure"); },
    AbortControllerImpl: class {
      constructor() {
        return { signal: { token: true }, abort() {} };
      }
    }
  });

  assert.equal(result, "ok");
});

test("timeout uses the captured abort operation even after injected controller mutation", async () => {
  let controller;
  let fireTimeout;
  let abortCalls = 0;
  const pending = new Promise(() => {});

  const operation = withListDownloadTimeout(() => {
    Object.defineProperty(controller, "abort", {
      configurable: true,
      get() { throw new Error("late abort getter must not run"); }
    });
    return pending;
  }, {
    timeoutMs: 10,
    setTimeoutImpl(callback) { fireTimeout = callback; return 9; },
    clearTimeoutImpl() {},
    AbortControllerImpl: class {
      constructor() {
        controller = {
          signal: { token: true },
          abort() { abortCalls += 1; }
        };
        return controller;
      }
    }
  });

  await Promise.resolve();
  fireTimeout();
  await assert.rejects(operation, /List download timed out/);
  assert.equal(abortCalls, 1);
});
