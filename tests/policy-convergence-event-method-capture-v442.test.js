import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("M442 convergence captures runtime/context/alarm event methods once", () => {
  assert.match(source, /function captureEvent\(event, label\)/);
  assert.match(source, /addListener: captureBoundMethod\(event, "addListener"/);
  assert.match(source, /removeListener: captureBoundMethod\(event, "removeListener"[\s\S]*false\)/);
  assert.match(source, /runtimeMessage: captureEvent\(runtimeMessage/);
  assert.match(source, /contextClicked: captureEvent\(contextClicked/);
  assert.match(source, /alarm: captureEvent\(alarm/);
});

test("M442 installation and disposal use only captured event operations", () => {
  assert.match(source, /installListenersTransactionally\(\[[\s\S]*events\.runtimeMessage[\s\S]*events\.contextClicked[\s\S]*events\.alarm/s);
  assert.match(source, /removeListenerBestEffort\(events\.runtimeMessage\.removeListener, onMessage\)/);
  assert.match(source, /removeListenerBestEffort\(events\.contextClicked\.removeListener, onContextClicked\)/);
  assert.match(source, /removeListenerBestEffort\(events\.alarm\.removeListener, onAlarm\)/);
  assert.doesNotMatch(source, /runtimeMessage\.addListener\(onMessage\)/);
});
