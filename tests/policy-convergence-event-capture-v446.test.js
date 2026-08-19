import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("M446 convergence captures bounded data-method event collaborators", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /function captureBoundMethod\(receiver, key, label, required = true\)/);
  assert.match(source, /function captureEvent\(event, label\)/);
  assert.match(source, /addListener: captureBoundMethod\(event, "addListener"/);
  assert.match(source, /removeListener: captureBoundMethod\(event, "removeListener"/);
});

test("M446 installation and disposal use only captured event operations", () => {
  assert.match(source, /installListenersTransactionally\(\[/);
  assert.match(source, /removeListenerBestEffort\(events\.runtimeMessage\.removeListener, onMessage\)/);
  assert.match(source, /removeListenerBestEffort\(events\.contextClicked\.removeListener, onContextClicked\)/);
  assert.match(source, /removeListenerBestEffort\(events\.alarm\.removeListener, onAlarm\)/);
});
