import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("M442 convergence captures event add/remove methods through bounded descriptors", () => {
  assert.match(source, /MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureBoundMethod\(receiver, key, label, required = true\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /Object\.getPrototypeOf\(current\)/);
  assert.match(source, /function captureEvent\(event, label\)/);
  assert.match(source, /addListener: captureBoundMethod\(event, "addListener"/);
  assert.match(source, /removeListener: captureBoundMethod\(event, "removeListener"/);
});

test("M442 convergence installs transactionally and disposes with captured removers", () => {
  assert.match(source, /function installListenersTransactionally\(entries\)/);
  assert.match(source, /for \(let index = installed\.length - 1; index >= 0; index -= 1\)/);
  assert.match(source, /removeListenerBestEffort\(events\.runtimeMessage\.removeListener, onMessage\)/);
  assert.match(source, /removeListenerBestEffort\(events\.contextClicked\.removeListener, onContextClicked\)/);
  assert.match(source, /removeListenerBestEffort\(events\.alarm\.removeListener, onAlarm\)/);
});
