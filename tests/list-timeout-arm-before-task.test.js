import test from "node:test";
import assert from "node:assert/strict";

import { withListDownloadTimeout } from "../src/core/list-updates.js";

test("throwing timer setup admits no source task work", async () => {
  let taskCalls = 0;
  await assert.rejects(
    withListDownloadTimeout(
      async () => { taskCalls += 1; },
      { setTimeoutImpl() { throw new Error("timer setup failed"); } }
    ),
    /timer setup failed/
  );
  assert.equal(taskCalls, 0);
});

test("synchronous expiry during arming aborts without starting the source task", async () => {
  let taskCalls = 0;
  let abortCalls = 0;
  let clearCalls = 0;
  class Controller {
    constructor() {
      this.signal = {};
      this.abort = () => { abortCalls += 1; };
    }
  }
  await assert.rejects(
    withListDownloadTimeout(
      async () => { taskCalls += 1; },
      {
        AbortControllerImpl: Controller,
        setTimeoutImpl(callback) {
          callback();
          return 123;
        },
        clearTimeoutImpl() { clearCalls += 1; }
      }
    ),
    /timed out/
  );
  assert.equal(taskCalls, 0);
  assert.equal(abortCalls, 1);
  assert.equal(clearCalls, 1);
});
