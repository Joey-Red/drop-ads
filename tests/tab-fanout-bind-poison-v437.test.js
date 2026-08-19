import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/tab-fanout.js", import.meta.url), "utf8");

test("M437 tab fanout sender capture bypasses callback-owned bind", () => {
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\)/);
  assert.doesNotMatch(source, /sendMessage\.bind\(tabs\)/);
  assert.doesNotMatch(source, /descriptor\.value\.bind\(receiver\)/);
});

test("M437 sender discovery remains bounded and receiver preserving", () => {
  assert.match(source, /MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /captureReceiverMethod\(tabs, "sendMessage", "Tab fanout tabs\.sendMessage"\)/);
  assert.match(source, /MAX_TAB_MESSAGE_CONCURRENCY = 32/);
});
