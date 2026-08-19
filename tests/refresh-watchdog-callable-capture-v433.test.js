import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M433 watchdog binds collaborators without callback-owned bind", () => {
  assert.match(source, /function capturedReceiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.match(source, /return capturedReceiverCall\(descriptor\.value, receiver\);/);
  assert.match(source, /const refreshListsOnce = capturedReceiverCall\(refreshField\.value, controller\);/);
  assert.match(source, /return capturedReceiverCall\(warnField\.value, loggerField\.value\);/);
  assert.doesNotMatch(source, /callback\.bind\(/);
  assert.doesNotMatch(source, /\.value\.bind\(/);
});

test("M433 watchdog keeps bounded prototype inspection and transactional listener rollback", () => {
  assert.match(source, /MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /addAlarmListener\(onAlarm\);/);
  assert.match(source, /catch \(error\) \{\s*active = false;\s*removeListenerBestEffort\(removeAlarmListener, onAlarm\);\s*throw error;/s);
});
