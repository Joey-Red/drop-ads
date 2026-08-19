import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/tab-fanout.js", import.meta.url), "utf8");

test("M451 tab fanout captures tabs and sendMessage through bounded descriptor inspection", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8;/);
  assert.match(source, /function captureReceiverData\(receiver, key, label\)/);
  assert.match(source, /function captureReceiverMethod\(receiver, key, label\)/);
  assert.match(source, /const tabs = captureReceiverData\(api, "tabs", "Tab fanout tabs API"\);/);
  assert.match(source, /captureReceiverMethod\(tabs, "sendMessage", "Tab fanout tabs\.sendMessage"\)/);
});

test("M451 captured sender keeps original receiver and avoids callback-owned bind", () => {
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
  assert.doesNotMatch(source, /sendMessage\.bind\(/);
  assert.doesNotMatch(source, /api\.tabs\.sendMessage/);
});
