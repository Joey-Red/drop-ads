import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M439 remote-list reader captures abort signal collaborators", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortSignal\.prototype, "aborted"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "addEventListener"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "removeEventListener"\)/);
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);/);
  assert.match(source, /signalCollaborators\.getAborted\(\)/);
  assert.doesNotMatch(source, /signal\?\.aborted/);
  assert.doesNotMatch(source, /signal\?\.addEventListener/);
  assert.doesNotMatch(source, /signal\?\.removeEventListener/);
});

test("M439 synthetic abort state revalidation fails closed", () => {
  assert.match(source, /const current = readPlainDataField\(signal, "aborted"\);/);
  assert.match(source, /if \(!current\.safe \|\| !current\.present \|\| typeof current\.value !== "boolean"\) return true;/);
  assert.match(source, /listener cleanup is best effort and must not replace the read outcome/);
});
