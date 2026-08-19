import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { withListDownloadTimeout } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M438 injected AbortController accessors are rejected before task work without getter execution", async () => {
  let signalGets = 0;
  let taskCalls = 0;
  class BadController {
    constructor() {
      Object.defineProperty(this, "signal", {
        enumerable: true,
        get() { signalGets += 1; return {}; }
      });
      this.abort = () => {};
    }
  }
  await assert.rejects(
    () => withListDownloadTimeout(() => { taskCalls += 1; }, { AbortControllerImpl: BadController }),
    /signal must be an own enumerable data field/
  );
  assert.equal(signalGets, 0);
  assert.equal(taskCalls, 0);
});

test("M438 timeout path uses captured signal/abort and timer cleanup is best effort", () => {
  assert.match(source, /const controllerCollaborators = captureAbortControllerCollaborators\(controller\);/);
  assert.match(source, /controllerCollaborators\.abort\(\)/);
  assert.match(source, /task\(controllerCollaborators\.signal\)/);
  assert.match(source, /clearTimeoutBestEffort\(clearTimeoutImpl, timer\)/);
  assert.doesNotMatch(source, /task\(controller\.signal\)/);
  assert.doesNotMatch(source, /controller\.abort\(\)/);
});
