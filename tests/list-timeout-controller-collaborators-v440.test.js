import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M440 timeout controller signal and abort are captured before scheduling", () => {
  assert.match(source, /function captureAbortControllerCollaborators\(controller\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortController\.prototype, "signal"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortController\.prototype, "abort"\)/);
  assert.match(source, /const controllerCollaborators = captureAbortControllerCollaborators\(controller\);\s*let timer = null;/s);
  assert.match(source, /controllerCollaborators\.abort\(\)/);
  assert.match(source, /task\(controllerCollaborators\.signal\)/);
  assert.doesNotMatch(source, /controller\.abort\(\)/);
  assert.doesNotMatch(source, /task\(controller\.signal\)/);
});

test("M440 timer identity detaches before best-effort cleanup", () => {
  assert.match(source, /function clearTimeoutBestEffort\(clearTimeoutImpl, timer\)/);
  assert.match(source, /const timerToClear = timer;\s*timer = null;\s*clearTimeoutBestEffort\(clearTimeoutImpl, timerToClear\);/s);
  assert.match(source, /timer cleanup must not replace the task outcome/);
});
