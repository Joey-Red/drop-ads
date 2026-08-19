import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/refresh-watchdog.js", import.meta.url), "utf8");

test("M439 watchdog receiver calls use Reflect.apply instead of callback-owned bind", () => {
  assert.match(source, /function capturedReceiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.match(source, /return capturedReceiverCall\(descriptor\.value, receiver\)/);
  assert.match(source, /const refreshListsOnce = capturedReceiverCall\(refreshField\.value, controller\)/);
  assert.doesNotMatch(source, /\.bind\(receiver\)/);
  assert.doesNotMatch(source, /warnField\.value\.bind/);
});
