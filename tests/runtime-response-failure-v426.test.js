import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { MAX_BACKGROUND_RUNTIME_ERROR_CHARS } from "../src/core/runtime.js";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M426 core runtime failure serialization uses one bounded descriptor-only formatter", () => {
  assert.equal(MAX_BACKGROUND_RUNTIME_ERROR_CHARS, 1024);
  assert.match(source, /function backgroundCaughtErrorMessage\(error, fallback\)/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(error, "message"\)/);
  assert.match(source, /descriptor\.value\.length <= MAX_BACKGROUND_RUNTIME_ERROR_CHARS/);
  assert.doesNotMatch(source, /instanceof Error \? error\.message/);
  assert.match(source, /function sendResponseBestEffort\(sendResponse, payload\)/);
});

test("M426 import activation and explicit runtime handlers use bounded failure delivery", () => {
  assert.match(source, /throw new Error\(boundedImportActivationError\(error, subscription\.title\)\)/);
  assert.match(source, /const room = Math\.max\(0, MAX_BACKGROUND_RUNTIME_ERROR_CHARS - prefix\.length\)/);
  assert.match(source, /sendResponseBestEffort\(sendResponse, \{ ok: false, error: backgroundCaughtErrorMessage\(error, "List refresh failed"\) \}\)/);
  assert.match(source, /sendResponseBestEffort\(sendResponse, \{ ok: false, error: backgroundCaughtErrorMessage\(error, "Could not import settings"\) \}\)/);
  assert.match(source, /sendResponseBestEffort\(sendResponse, \{ ok: false, error: backgroundCaughtErrorMessage\(error, "Could not prepare community submission"\) \}\)/);
});
