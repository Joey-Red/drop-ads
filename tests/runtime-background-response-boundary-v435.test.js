import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("background runtime failures use one descriptor-only 1024-character boundary", () => {
  assert.match(source, /export const MAX_BACKGROUND_RUNTIME_ERROR_CHARS = 1_024/);
  assert.match(source, /function backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.match(source, /descriptor\.value\.length <= MAX_BACKGROUND_RUNTIME_ERROR_CHARS/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
});

test("asynchronous core replies are best effort and import activation text is bounded", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\)/);
  assert.match(source, /try \{ sendResponse\(payload\); \} catch/);
  assert.match(source, /function boundedImportActivationError\(error, title\)/);
  assert.match(source, /MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix\.length/);
  assert.match(source, /sendResponseBestEffort\(sendResponse, \{ ok: false, error: backgroundCaughtErrorMessage/);
});
