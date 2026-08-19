import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M433 refresh watchdog never relies on callback-owned bind", () => {
  assert.match(source, /function capturedReceiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.match(source, /return capturedReceiverCall\(warnField\.value, loggerField\.value\)/);
  assert.match(source, /const refreshListsOnce = capturedReceiverCall\(refreshField\.value, controller\)/);
  assert.match(source, /return capturedReceiverCall\(descriptor\.value, receiver\)/);
  assert.doesNotMatch(source, /\.bind\(/);
});

test("M433 watchdog collaborator prototype search remains bounded", () => {
  assert.match(source, /MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /depth <= MAX_COLLABORATOR_PROTOTYPE_DEPTH/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
});
