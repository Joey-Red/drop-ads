import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M435 abort signal collaborators are captured through native-compatible boundaries", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /NativeAbortSignal = globalThis\.AbortSignal/);
  assert.match(source, /NativeEventTarget = globalThis\.EventTarget/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortSignal\.prototype, "aborted"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "addEventListener"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "removeEventListener"\)/);
});

test("M435 streamed reads use captured abort state and listener operations", () => {
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);/);
  assert.match(source, /signalCollaborators\.getAborted\(\)/);
  assert.match(source, /signalCollaborators\.addAbortListener\("abort", onAbort, \{ once: true \}\)/);
  assert.match(source, /signalCollaborators\.removeAbortListener\("abort", onAbort\)/);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
});
