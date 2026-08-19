import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M438 captures native and synthetic abort-signal collaborators", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortSignal\.prototype, "aborted"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "addEventListener"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "removeEventListener"\)/);
  assert.match(source, /readPlainDataField\(signal, "aborted"\)/);
  assert.match(source, /readPlainDataField\(signal, "addEventListener"\)/);
  assert.match(source, /readPlainDataField\(signal, "removeEventListener"\)/);
});

test("M438 streamed reads use captured signal operations and isolate cleanup", () => {
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);/);
  assert.match(source, /signalCollaborators\.getAborted\(\)/);
  assert.match(source, /signalCollaborators\.addAbortListener\("abort", onAbort, \{ once: true \}\)/);
  assert.match(source, /signalCollaborators\.removeAbortListener\("abort", onAbort\)/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
});
