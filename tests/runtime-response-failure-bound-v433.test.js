import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M433 core runtime failures use the reviewed bounded descriptor-only formatter", () => {
  assert.match(source, /export const MAX_BACKGROUND_RUNTIME_ERROR_CHARS = 1_024;/);
  assert.match(source, /function backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.doesNotMatch(source, /error instanceof Error \? error\.message/);
  assert.match(source, /function boundedImportActivationError\(error, title\)/);
  assert.match(source, /MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix\.length/);
});

test("M433 asynchronous response delivery is best effort across core handlers", () => {
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\) \{\s*try \{ sendResponse\(payload\); \} catch/s);
  assert.match(source, /respondTask[\s\S]*sendResponseBestEffort\(sendResponse, \{ ok: true, result \}\)/);
  assert.match(source, /sendResponseBestEffort\(sendResponse, \{ ok: false, error: backgroundCaughtErrorMessage/);
  assert.doesNotMatch(source, /\.then\([^\n]*=> sendResponse\(/);
});
