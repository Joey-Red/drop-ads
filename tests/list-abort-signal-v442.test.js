import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/list-updates.js", import.meta.url), "utf8");

test("M442 captures native-compatible abort-signal collaborators once", () => {
  assert.match(source, /function captureAbortSignalCollaborators\(signal\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeAbortSignal\.prototype, "aborted"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "addEventListener"\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(NativeEventTarget\.prototype, "removeEventListener"\)/);
  assert.match(source, /const signalCollaborators = captureAbortSignalCollaborators\(signal\);/);
});

test("M442 bounded reader uses only captured abort operations", () => {
  const start = source.indexOf("export async function readResponseTextBounded");
  const end = source.indexOf("export async function downloadAndParseSubscription", start);
  const block = source.slice(start, end);
  assert.match(block, /signalCollaborators\.addAbortListener/);
  assert.match(block, /signalCollaborators\.getAborted\(\)/);
  assert.match(block, /signalCollaborators\.removeAbortListener/);
  assert.doesNotMatch(block, /signal\?\.addEventListener/);
  assert.doesNotMatch(block, /signal\?\.aborted/);
  assert.doesNotMatch(block, /signal\?\.removeEventListener/);
});
