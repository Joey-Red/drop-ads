import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M433 refresh watchdog receiver capture does not invoke callback-owned bind", () => {
  assert.match(source, /function capturedReceiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.doesNotMatch(source, /descriptor\.value\.bind\(receiver\)/);
  assert.doesNotMatch(source, /warnField\.value\.bind\(loggerField\.value\)/);
  assert.doesNotMatch(source, /refreshField\.value\.bind\(controller\)/);
});

test("M433 refresh watchdog keeps captured receiver for logger, controller, and alarms", () => {
  assert.match(source, /capturedReceiverCall\(warnField\.value, loggerField\.value\)/);
  assert.match(source, /capturedReceiverCall\(refreshField\.value, controller\)/);
  assert.match(source, /return capturedReceiverCall\(descriptor\.value, receiver\)/);
});
