import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("M435 policy convergence receiver capture never consults callback-owned bind", () => {
  assert.match(source, /function receiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.doesNotMatch(source, /errorField\.value\.bind\(loggerField\.value\)/);
  assert.doesNotMatch(source, /descriptor\.value\.bind\(receiver\)/);
  assert.doesNotMatch(source, /syncField\.value\.bind\(controller\)/);
});

test("M435 policy convergence retains original receivers for logger, events, and sync", () => {
  assert.match(source, /receiverCall\(errorField\.value, loggerField\.value\)/);
  assert.match(source, /return receiverCall\(descriptor\.value, receiver\)/);
  assert.match(source, /const syncRules = receiverCall\(syncField\.value, controller\)/);
});
