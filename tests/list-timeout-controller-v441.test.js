import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M441 captures AbortController collaborators before task scheduling", () => {
  assert.match(source, /function captureAbortControllerCollaborators\(controller\)/);
  assert.match(source, /const controllerCollaborators = captureAbortControllerCollaborators\(controller\);/);
  assert.match(source, /controllerCollaborators\.abort\(\)/);
  assert.match(source, /task\(controllerCollaborators\.signal\)/);
  assert.doesNotMatch(source, /task\(controller\.signal\)/);
});

test("M441 timer cleanup releases identity and is best effort", () => {
  assert.match(source, /function clearTimeoutBestEffort\(clearTimeoutImpl, timer\)/);
  assert.match(source, /const timerToClear = timer;\s*timer = null;\s*clearTimeoutBestEffort\(clearTimeoutImpl, timerToClear\);/s);
});
