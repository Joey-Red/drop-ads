import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M433 core runtime failure text is descriptor-only and bounded", () => {
  assert.match(source, /export const MAX_BACKGROUND_RUNTIME_ERROR_CHARS = 1_024;/);
  assert.match(source, /function backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.match(source, /descriptor\.value\.length <= MAX_BACKGROUND_RUNTIME_ERROR_CHARS/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
});

test("M433 async response delivery is best effort across core handlers", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\)/);
  assert.match(source, /try \{ sendResponse\(payload\); \} catch/);
  assert.match(source, /respondTask[\s\S]*sendResponseBestEffort/);
  assert.match(source, /boundedImportActivationError\(error, subscription\.title\)/);
  assert.match(source, /MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix\.length/);
});
