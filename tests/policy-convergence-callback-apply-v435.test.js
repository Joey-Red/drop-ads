import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("M435 convergence collaborators use receiver-bound Reflect.apply wrappers", () => {
  assert.match(source, /function receiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.match(source, /return receiverCall\(errorField\.value, loggerField\.value\)/);
  assert.match(source, /const syncRules = receiverCall\(syncField\.value, controller\)/);
  assert.match(source, /return receiverCall\(descriptor\.value, receiver\)/);
});

test("M435 convergence installation never consults callback-owned bind", () => {
  assert.doesNotMatch(source, /\.bind\s*\(/);
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /must be a data function/);
});

test("M435 event installation and teardown continue to use captured collaborators", () => {
  assert.match(source, /installListenersTransactionally\(\[/);
  assert.match(source, /removeListenerBestEffort\(events\.runtimeMessage\.removeListener, onMessage\)/);
  assert.match(source, /removeListenerBestEffort\(events\.contextClicked\.removeListener, onContextClicked\)/);
  assert.match(source, /removeListenerBestEffort\(events\.alarm\.removeListener, onAlarm\)/);
});
