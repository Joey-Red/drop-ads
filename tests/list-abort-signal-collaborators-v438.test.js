import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M438 captures abort-signal state and listener collaborators", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortSignal\.prototype, "aborted"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "addEventListener"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "removeEventListener"\)/);
  assert.match(source, /readPlainDataField\(signal, "aborted"\)/);
  assert.match(source, /readPlainDataField\(signal, "addEventListener"\)/);
  assert.match(source, /readPlainDataField\(signal, "removeEventListener"\)/);
});

test("M438 read loop uses only captured signal operations", () => {
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /signalCollaborators\.addAbortListener/);
  assert.match(source, /signalCollaborators\.getAborted\(\)/);
  assert.match(source, /signalCollaborators\.removeAbortListener/);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
});
