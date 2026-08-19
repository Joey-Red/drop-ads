import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/tab-fanout.js", import.meta.url), "utf8");

test("M445 tab sender is captured through bounded descriptor/prototype inspection", () => {
  assert.match(source, /const MAX_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureReceiverMethod\(receiver, key, label\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(current, key\)/);
  assert.match(source, /throw new TypeError\(`\$\{label\} must be a data function`\)/);
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\)/);
});

test("M445 sendMessage is captured before tab/message fanout work", () => {
  const captureIndex = source.indexOf("const sendMessage = captureTabSender(api)");
  const tabIndex = source.indexOf("const tabCandidates = snapshotDenseDataArray", captureIndex);
  const cloneIndex = source.indexOf("const messageSnapshot = cloneFanoutMessage", captureIndex);
  assert.ok(captureIndex >= 0);
  assert.ok(tabIndex > captureIndex);
  assert.ok(cloneIndex > captureIndex);
  assert.doesNotMatch(source, /sendMessage\.bind\s*\(/);
  assert.doesNotMatch(source, /api\.tabs\.sendMessage\s*\(/);
});

test("M445 reviewed fanout concurrency ceiling remains unchanged", () => {
  assert.match(source, /export const MAX_TAB_MESSAGE_CONCURRENCY = 32/);
  assert.match(source, /Promise\.allSettled\(batch\.map\(sendOne\)\)/);
});
